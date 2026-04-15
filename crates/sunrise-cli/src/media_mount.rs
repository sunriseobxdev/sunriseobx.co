/// Cross-platform media mount — embeds a WebDAV server that tunnels through gRPC.
/// The user sees: `sunrise-cli mount-media Z:\` → drive appears. That's it.

use crate::media_fs::proto::media_fs_client::MediaFsClient;
use crate::media_fs::proto::*;
use bytes::Bytes;
use http_body_util::Full;
use hyper::server::conn::http1;
use hyper::service::service_fn;
use hyper::{Request, Response, StatusCode, Method};
use hyper_util::rt::TokioIo;
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::net::TcpListener;
use tonic::metadata::MetadataValue;

struct DavState {
    endpoint: String,
    token: String,
}

impl DavState {
    async fn client(&self) -> Result<MediaFsClient<tonic::transport::Channel>, String> {
        MediaFsClient::connect(self.endpoint.clone()).await.map_err(|e| e.to_string())
    }

    fn auth_req<T>(&self, inner: T) -> tonic::Request<T> {
        let mut req = tonic::Request::new(inner);
        if let Ok(v) = format!("Bearer {}", self.token).parse::<MetadataValue<tonic::metadata::Ascii>>() {
            req.metadata_mut().insert("authorization", v);
        }
        req
    }
}

/// Minimal WebDAV handler — just enough for OS mount clients
async fn handle_dav(
    req: Request<hyper::body::Incoming>,
    state: Arc<DavState>,
) -> Result<Response<Full<Bytes>>, hyper::Error> {
    let path = percent_decode(req.uri().path());
    let path = path.trim_start_matches('/');

    let resp = match *req.method() {
        Method::OPTIONS => {
            Response::builder()
                .status(200)
                .header("DAV", "1, 2")
                .header("Allow", "OPTIONS, PROPFIND, GET, PUT, DELETE, MKCOL, HEAD")
                .header("MS-Author-Via", "DAV")
                .body(Full::new(Bytes::new()))
                .unwrap()
        }

        // PROPFIND — directory listing or file stat
        ref m if m.as_str() == "PROPFIND" => {
            let depth = req.headers().get("Depth").and_then(|v| v.to_str().ok()).unwrap_or("1");
            propfind(&state, path, depth).await
        }

        Method::GET => get_file(&state, path, false).await,

        Method::HEAD => get_file(&state, path, true).await,

        Method::PUT => {
            let body = http_body_util::BodyExt::collect(req.into_body()).await
                .map(|b| b.to_bytes().to_vec())
                .unwrap_or_default();
            put_file(&state, path, &body).await
        }

        Method::DELETE => {
            delete_file(&state, path).await
        }

        ref m if m.as_str() == "MKCOL" => {
            mkcol(&state, path).await
        }

        _ => {
            Response::builder().status(405).body(Full::new(Bytes::from("Method Not Allowed"))).unwrap()
        }
    };

    Ok(resp)
}

async fn propfind(state: &DavState, path: &str, depth: &str) -> Response<Full<Bytes>> {
    let mut client = match state.client().await {
        Ok(c) => c,
        Err(_) => return error_resp(502, "gRPC unavailable"),
    };

    // Stat the requested path
    let stat = client.stat(state.auth_req(StatRequest { path: path.to_string() })).await;
    let (is_dir, size) = match stat {
        Ok(r) => { let s = r.into_inner(); (s.is_dir, s.size) }
        Err(_) if path.is_empty() => (true, 0), // root always exists
        Err(_) => return error_resp(404, "Not Found"),
    };

    let href = format!("/{}", path);
    let mut xml = String::from("<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<D:multistatus xmlns:D=\"DAV:\">\n");

    // Entry for the requested resource
    xml.push_str(&propfind_entry(&href, is_dir, size));

    // If directory and depth > 0, list children
    if is_dir && depth != "0" {
        if let Ok(resp) = client.read_dir(state.auth_req(ReadDirRequest { path: path.to_string() })).await {
            for entry in resp.into_inner().entries {
                let child_href = if path.is_empty() {
                    format!("/{}", entry.name)
                } else {
                    format!("/{}/{}", path, entry.name)
                };
                let child_href = if entry.is_dir { format!("{}/", child_href) } else { child_href };
                xml.push_str(&propfind_entry(&child_href, entry.is_dir, entry.size));
            }
        }
    }

    xml.push_str("</D:multistatus>\n");

    Response::builder()
        .status(207) // Multi-Status
        .header("Content-Type", "application/xml; charset=utf-8")
        .body(Full::new(Bytes::from(xml)))
        .unwrap()
}

fn propfind_entry(href: &str, is_dir: bool, size: u64) -> String {
    let resource_type = if is_dir {
        "<D:resourcetype><D:collection/></D:resourcetype>"
    } else {
        "<D:resourcetype/>"
    };
    format!(
        "<D:response>\n<D:href>{}</D:href>\n<D:propstat>\n<D:prop>\n{}\n<D:getcontentlength>{}</D:getcontentlength>\n</D:prop>\n<D:status>HTTP/1.1 200 OK</D:status>\n</D:propstat>\n</D:response>\n",
        xml_escape(href), resource_type, size
    )
}

async fn get_file(state: &DavState, path: &str, head_only: bool) -> Response<Full<Bytes>> {
    if path.is_empty() { return error_resp(404, "Not Found"); }
    let mut client = match state.client().await {
        Ok(c) => c,
        Err(_) => return error_resp(502, "gRPC unavailable"),
    };

    // Read entire file via streaming
    let req = state.auth_req(ReadRequest { path: path.to_string(), offset: 0, size: 0 });
    match client.read(req).await {
        Ok(resp) => {
            if head_only {
                return Response::builder()
                    .status(200)
                    .header("Content-Type", "application/octet-stream")
                    .body(Full::new(Bytes::new()))
                    .unwrap();
            }
            let mut data = Vec::new();
            let mut stream = resp.into_inner();
            while let Ok(Some(chunk)) = stream.message().await {
                data.extend_from_slice(&chunk.data);
                if chunk.eof { break; }
            }
            Response::builder()
                .status(200)
                .header("Content-Type", "application/octet-stream")
                .header("Content-Length", data.len().to_string())
                .body(Full::new(Bytes::from(data)))
                .unwrap()
        }
        Err(_) => error_resp(404, "Not Found"),
    }
}

async fn put_file(state: &DavState, path: &str, data: &[u8]) -> Response<Full<Bytes>> {
    let mut client = match state.client().await {
        Ok(c) => c,
        Err(_) => return error_resp(502, "gRPC unavailable"),
    };

    let chunks = vec![WriteChunk {
        path: path.to_string(),
        data: data.to_vec(),
        finish: true,
        content_type: String::new(),
    }];
    let mut req = tonic::Request::new(tokio_stream::iter(chunks));
    if let Ok(v) = format!("Bearer {}", state.token).parse::<MetadataValue<tonic::metadata::Ascii>>() {
        req.metadata_mut().insert("authorization", v);
    }

    match client.write(req).await {
        Ok(_) => Response::builder().status(201).body(Full::new(Bytes::from("Created"))).unwrap(),
        Err(_) => error_resp(500, "Write failed"),
    }
}

async fn delete_file(state: &DavState, path: &str) -> Response<Full<Bytes>> {
    let mut client = match state.client().await {
        Ok(c) => c,
        Err(_) => return error_resp(502, "gRPC unavailable"),
    };
    match client.delete(state.auth_req(DeleteRequest { path: path.to_string() })).await {
        Ok(_) => Response::builder().status(204).body(Full::new(Bytes::new())).unwrap(),
        Err(_) => error_resp(500, "Delete failed"),
    }
}

async fn mkcol(state: &DavState, path: &str) -> Response<Full<Bytes>> {
    let mut client = match state.client().await {
        Ok(c) => c,
        Err(_) => return error_resp(502, "gRPC unavailable"),
    };
    match client.mkdir(state.auth_req(MkdirRequest { path: path.to_string() })).await {
        Ok(_) => Response::builder().status(201).body(Full::new(Bytes::from("Created"))).unwrap(),
        Err(_) => error_resp(500, "Mkdir failed"),
    }
}

fn error_resp(status: u16, msg: &str) -> Response<Full<Bytes>> {
    Response::builder()
        .status(StatusCode::from_u16(status).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR))
        .body(Full::new(Bytes::from(msg.to_string())))
        .unwrap()
}

fn xml_escape(s: &str) -> String {
    s.replace('&', "&amp;").replace('<', "&lt;").replace('>', "&gt;").replace('"', "&quot;")
}

fn percent_decode(s: &str) -> String {
    let mut out = Vec::new();
    let bytes = s.as_bytes();
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' && i + 2 < bytes.len() {
            if let Ok(b) = u8::from_str_radix(&s[i+1..i+3], 16) {
                out.push(b); i += 3; continue;
            }
        }
        out.push(bytes[i]); i += 1;
    }
    String::from_utf8_lossy(&out).to_string()
}

/// The main mount function — one command, seamless drive.
pub async fn mount(grpc_endpoint: &str, token: &str, mountpoint: &str) -> Result<(), String> {
    // 1. Verify auth
    let mut client = MediaFsClient::connect(grpc_endpoint.to_string())
        .await.map_err(|e| format!("Cannot connect to media server: {}", e))?;
    let mut req = tonic::Request::new(ReadDirRequest { path: String::new() });
    if let Ok(v) = format!("Bearer {}", token).parse::<MetadataValue<tonic::metadata::Ascii>>() {
        req.metadata_mut().insert("authorization", v);
    }
    client.read_dir(req).await.map_err(|e| format!("Auth failed: {}", e))?;

    // 2. Start embedded WebDAV server on random port
    let listener = TcpListener::bind("127.0.0.1:0").await
        .map_err(|e| format!("Cannot bind: {}", e))?;
    let port = listener.local_addr().unwrap().port();

    let state = Arc::new(DavState {
        endpoint: grpc_endpoint.to_string(),
        token: token.to_string(),
    });

    let state2 = state.clone();
    tokio::spawn(async move {
        loop {
            let (stream, _) = match listener.accept().await {
                Ok(s) => s,
                Err(_) => continue,
            };
            let state = state2.clone();
            tokio::spawn(async move {
                let _ = http1::Builder::new()
                    .serve_connection(
                        TokioIo::new(stream),
                        service_fn(move |req| {
                            let state = state.clone();
                            async move { handle_dav(req, state).await }
                        }),
                    )
                    .await;
            });
        }
    });

    // 3. Mount using OS-native tools
    let dav_url = format!("http://127.0.0.1:{}", port);

    #[cfg(target_os = "windows")]
    {
        // Windows: net use DRIVE http://host/
        let drive = mountpoint.trim_end_matches('\\').trim_end_matches('/');
        let status = std::process::Command::new("net")
            .args(["use", drive, &dav_url])
            .status()
            .map_err(|e| format!("net use failed: {}", e))?;
        if !status.success() {
            return Err("net use failed — is the WebClient service running? Run: sc start WebClient".into());
        }
        eprintln!();
        eprintln!("  Sunrise Media mounted at {}", drive);
        eprintln!("  Ctrl+C to unmount");
        eprintln!();

        // Wait for Ctrl+C
        tokio::signal::ctrl_c().await.ok();

        // Unmount
        let _ = std::process::Command::new("net").args(["use", drive, "/delete", "/y"]).status();
        eprintln!("  Unmounted {}", drive);
    }

    #[cfg(target_os = "macos")]
    {
        std::fs::create_dir_all(mountpoint).ok();
        let status = std::process::Command::new("mount_webdav")
            .args(["-S", &dav_url, mountpoint])
            .status()
            .map_err(|e| format!("mount_webdav failed: {}", e))?;
        if !status.success() {
            return Err("mount_webdav failed".into());
        }
        eprintln!();
        eprintln!("  Sunrise Media mounted at {}", mountpoint);
        eprintln!("  Ctrl+C to unmount");
        eprintln!();

        tokio::signal::ctrl_c().await.ok();

        let _ = std::process::Command::new("umount").arg(mountpoint).status();
        eprintln!("  Unmounted {}", mountpoint);
    }

    #[cfg(target_os = "linux")]
    {
        std::fs::create_dir_all(mountpoint).ok();
        // Try mount -t davfs first, fall back to gio mount
        let status = std::process::Command::new("mount")
            .args(["-t", "davfs", &dav_url, mountpoint, "-o", "noexec"])
            .status();
        let mounted = matches!(status, Ok(s) if s.success());

        if !mounted {
            // Try gio (GNOME VFS)
            let gio_status = std::process::Command::new("gio")
                .args(["mount", &dav_url])
                .status();
            if !matches!(gio_status, Ok(s) if s.success()) {
                eprintln!("  WebDAV mount unavailable. Install davfs2 or use FUSE:");
                eprintln!("  sunrise-cli mount-media {} (rebuild with --features fuse)", mountpoint);
                return Err("No WebDAV mount tool available".into());
            }
        }

        eprintln!();
        eprintln!("  Sunrise Media mounted at {}", mountpoint);
        eprintln!("  Ctrl+C to unmount");
        eprintln!();

        tokio::signal::ctrl_c().await.ok();

        if mounted {
            let _ = std::process::Command::new("umount").arg(mountpoint).status();
        } else {
            let _ = std::process::Command::new("gio").args(["mount", "-u", &dav_url]).status();
        }
        eprintln!("  Unmounted {}", mountpoint);
    }

    Ok(())
}
