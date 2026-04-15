use std::pin::Pin;
use std::sync::Arc;
use tokio_stream::{Stream, StreamExt};
use tonic::{Request, Response, Status, Streaming};

mod gcs;

pub mod proto {
    tonic::include_proto!("sunrise.media");
}

use proto::media_fs_server::{MediaFs, MediaFsServer};
use proto::*;

const CHUNK_SIZE: usize = 256 * 1024;

fn extract_token(metadata: &tonic::metadata::MetadataMap) -> Option<String> {
    metadata
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "))
        .map(|s| s.to_string())
}

fn verify(metadata: &tonic::metadata::MetadataMap, secret: &str) -> Result<(), Status> {
    if secret.is_empty() { return Ok(()); }
    let token = extract_token(metadata).ok_or_else(|| Status::unauthenticated("missing auth"))?;
    let key = jsonwebtoken::DecodingKey::from_secret(secret.as_bytes());
    let mut val = jsonwebtoken::Validation::new(jsonwebtoken::Algorithm::HS256);
    val.validate_exp = true;
    val.required_spec_claims.clear();
    jsonwebtoken::decode::<serde_json::Value>(&token, &key, &val)
        .map_err(|_| Status::unauthenticated("invalid token"))?;
    Ok(())
}

struct Svc {
    gcs: Arc<gcs::GcsClient>,
    secret: String,
}

#[tonic::async_trait]
impl MediaFs for Svc {
    async fn stat(&self, req: Request<StatRequest>) -> Result<Response<StatResponse>, Status> {
        verify(req.metadata(), &self.secret)?;
        let (is_dir, size, modified) = self.gcs.stat(&req.get_ref().path).await
            .ok_or_else(|| Status::not_found("not found"))?;
        Ok(Response::new(StatResponse { is_dir, size, modified, content_type: String::new() }))
    }

    async fn read_dir(&self, req: Request<ReadDirRequest>) -> Result<Response<ReadDirResponse>, Status> {
        verify(req.metadata(), &self.secret)?;
        let entries = self.gcs.readdir(&req.get_ref().path).await
            .into_iter()
            .map(|(name, is_dir, size)| DirEntry { name, is_dir, size })
            .collect();
        Ok(Response::new(ReadDirResponse { entries }))
    }

    type ReadStream = Pin<Box<dyn Stream<Item = Result<DataChunk, Status>> + Send>>;

    async fn read(&self, req: Request<ReadRequest>) -> Result<Response<Self::ReadStream>, Status> {
        verify(req.metadata(), &self.secret)?;
        let r = req.get_ref();
        let data = self.gcs.read(&r.path, r.offset, r.size).await
            .ok_or_else(|| Status::not_found("not found"))?;

        let offset = r.offset;
        let stream = async_stream::stream! {
            let mut pos = offset;
            for chunk in data.chunks(CHUNK_SIZE) {
                yield Ok(DataChunk { data: chunk.to_vec(), offset: pos, eof: false });
                pos += chunk.len() as u64;
            }
            yield Ok(DataChunk { data: vec![], offset: pos, eof: true });
        };
        Ok(Response::new(Box::pin(stream)))
    }

    async fn write(&self, req: Request<Streaming<WriteChunk>>) -> Result<Response<WriteResponse>, Status> {
        verify(req.metadata(), &self.secret)?;
        let mut stream = req.into_inner();
        let mut path = String::new();
        let mut buf = Vec::new();

        while let Some(chunk) = stream.next().await {
            let chunk = chunk?;
            if !chunk.path.is_empty() { path = chunk.path; }
            buf.extend_from_slice(&chunk.data);
            if chunk.finish { break; }
        }

        if path.is_empty() { return Err(Status::invalid_argument("path required")); }
        let len = buf.len() as u64;
        if self.gcs.write(&path, &buf).await {
            Ok(Response::new(WriteResponse { bytes_written: len }))
        } else {
            Err(Status::internal("GCS write failed"))
        }
    }

    async fn delete(&self, req: Request<DeleteRequest>) -> Result<Response<OkResponse>, Status> {
        verify(req.metadata(), &self.secret)?;
        if self.gcs.delete(&req.get_ref().path).await {
            Ok(Response::new(OkResponse { ok: true }))
        } else { Err(Status::internal("delete failed")) }
    }

    async fn mkdir(&self, req: Request<MkdirRequest>) -> Result<Response<OkResponse>, Status> {
        verify(req.metadata(), &self.secret)?;
        if self.gcs.mkdir(&req.get_ref().path).await {
            Ok(Response::new(OkResponse { ok: true }))
        } else { Err(Status::internal("mkdir failed")) }
    }

    async fn rename(&self, req: Request<RenameRequest>) -> Result<Response<OkResponse>, Status> {
        verify(req.metadata(), &self.secret)?;
        let r = req.get_ref();
        if let Some(data) = self.gcs.read(&r.from, 0, 0).await {
            if self.gcs.write(&r.to, &data).await && self.gcs.delete(&r.from).await {
                return Ok(Response::new(OkResponse { ok: true }));
            }
        }
        Err(Status::internal("rename failed"))
    }
}

#[tokio::main]
async fn main() {
    env_logger::init();
    let port: u16 = std::env::var("PORT").ok().and_then(|p| p.parse().ok()).unwrap_or(9999);
    let bucket = std::env::var("GCS_CDN_BUCKET").unwrap_or_else(|_| "sunriseobx-cdn".into());
    let secret = std::env::var("JWT_SECRET").unwrap_or_default();

    let gcs = Arc::new(gcs::GcsClient::new(&bucket));
    let addr: std::net::SocketAddr = format!("0.0.0.0:{}", port).parse().unwrap();

    eprintln!("sunrise-media-server gRPC :{} bucket={}", port, bucket);

    // Health check on a separate port
    let health_port = port + 1;
    tokio::spawn(async move {
        let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", health_port)).await.unwrap();
        eprintln!("Health check on :{}", health_port);
        loop {
            if let Ok((mut stream, _)) = listener.accept().await {
                use tokio::io::AsyncWriteExt;
                let _ = stream.write_all(b"HTTP/1.1 200 OK\r\nContent-Length: 2\r\n\r\nok").await;
            }
        }
    });

    tonic::transport::Server::builder()
        .add_service(MediaFsServer::new(Svc { gcs, secret }))
        .serve(addr)
        .await
        .expect("server");
}
