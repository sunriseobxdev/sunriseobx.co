/// FUSE filesystem backed by the Sunrise gRPC media server.
/// `sunrise-cli mount-media /mnt/sunriseobx` — single command, seamless mount.

pub mod proto {
    tonic::include_proto!("sunrise.media");
}

#[allow(unused_imports)]
pub use proto::media_fs_client::MediaFsClient;
#[allow(unused_imports)]
pub use proto::*;

// The FUSE mount implementation is gated behind the "fuse" feature.
// Without it, mount-media gracefully tells the user it's not available.

#[cfg(all(unix, feature = "fuse"))]
mod fuse_impl {
    use super::proto::media_fs_client::MediaFsClient;
    use super::proto::*;
    use fuser::{
        FileAttr, FileType, Filesystem, MountOption, ReplyAttr, ReplyData, ReplyDirectory,
        ReplyEntry, ReplyWrite, Request,
    };
    use std::collections::HashMap;
    use std::ffi::OsStr;
    use std::sync::Mutex;
    use std::time::{Duration, SystemTime};
    use tokio::runtime::Runtime;
    use tonic::metadata::MetadataValue;

    const TTL: Duration = Duration::from_secs(5);
    const BLOCK_SIZE: u32 = 512;

    #[derive(Debug, Clone)]
    struct CachedEntry {
        name: String, is_dir: bool, size: u64, gcs_path: String,
    }

    struct InodeTable {
        next_ino: u64,
        ino_to_path: HashMap<u64, String>,
        path_to_ino: HashMap<String, u64>,
    }

    impl InodeTable {
        fn new() -> Self {
            let mut t = Self { next_ino: 2, ino_to_path: HashMap::new(), path_to_ino: HashMap::new() };
            t.ino_to_path.insert(1, String::new());
            t.path_to_ino.insert(String::new(), 1);
            t
        }
        fn get_or_create(&mut self, path: &str) -> u64 {
            let clean = path.trim_end_matches('/');
            if let Some(&ino) = self.path_to_ino.get(clean) { return ino; }
            let ino = self.next_ino; self.next_ino += 1;
            self.ino_to_path.insert(ino, clean.to_string());
            self.path_to_ino.insert(clean.to_string(), ino);
            ino
        }
        fn get_path(&self, ino: u64) -> Option<&str> {
            self.ino_to_path.get(&ino).map(|s| s.as_str())
        }
    }

    pub struct GrpcMediaFs {
        rt: Runtime,
        endpoint: String,
        token: String,
        inodes: Mutex<InodeTable>,
        dir_cache: Mutex<HashMap<String, (std::time::Instant, Vec<CachedEntry>)>>,
    }

    impl GrpcMediaFs {
        pub fn new(endpoint: &str, token: &str) -> Self {
            Self {
                rt: Runtime::new().expect("tokio"),
                endpoint: endpoint.to_string(),
                token: token.to_string(),
                inodes: Mutex::new(InodeTable::new()),
                dir_cache: Mutex::new(HashMap::new()),
            }
        }

        fn client(&self) -> MediaFsClient<tonic::transport::Channel> {
            self.rt.block_on(async { MediaFsClient::connect(self.endpoint.clone()).await.expect("gRPC") })
        }

        fn auth_req<T>(&self, inner: T) -> tonic::Request<T> {
            let mut req = tonic::Request::new(inner);
            if let Ok(val) = format!("Bearer {}", self.token).parse::<MetadataValue<tonic::metadata::Ascii>>() {
                req.metadata_mut().insert("authorization", val);
            }
            req
        }

        fn grpc_readdir(&self, path: &str) -> Vec<CachedEntry> {
            { let c = self.dir_cache.lock().unwrap(); if let Some((ts, e)) = c.get(path) { if ts.elapsed() < Duration::from_secs(5) { return e.clone(); } } }
            let entries: Vec<CachedEntry> = self.rt.block_on(async {
                let mut c = self.client();
                match c.read_dir(self.auth_req(ReadDirRequest { path: path.to_string() })).await {
                    Ok(r) => {
                        let pfx = if path.is_empty() { String::new() } else if path.ends_with('/') { path.to_string() } else { format!("{}/", path) };
                        r.into_inner().entries.into_iter().map(|e| CachedEntry {
                            gcs_path: format!("{}{}{}", pfx, e.name, if e.is_dir { "/" } else { "" }),
                            name: e.name, is_dir: e.is_dir, size: e.size,
                        }).collect()
                    }
                    Err(_) => vec![],
                }
            });
            self.dir_cache.lock().unwrap().insert(path.to_string(), (std::time::Instant::now(), entries.clone()));
            entries
        }

        fn grpc_stat(&self, path: &str) -> Option<(bool, u64)> {
            self.rt.block_on(async {
                let mut c = self.client();
                c.stat(self.auth_req(StatRequest { path: path.to_string() })).await.ok().map(|r| { let s = r.into_inner(); (s.is_dir, s.size) })
            })
        }

        fn grpc_read(&self, path: &str, offset: u64, size: u64) -> Vec<u8> {
            self.rt.block_on(async {
                let mut c = self.client();
                match c.read(self.auth_req(ReadRequest { path: path.to_string(), offset, size })).await {
                    Ok(r) => { let mut s = r.into_inner(); let mut b = Vec::new(); while let Ok(Some(ch)) = s.message().await { b.extend_from_slice(&ch.data); if ch.eof { break; } } b }
                    Err(_) => vec![],
                }
            })
        }

        fn grpc_write(&self, path: &str, data: &[u8]) -> bool {
            self.rt.block_on(async {
                let mut c = self.client();
                let chunks = vec![WriteChunk { path: path.to_string(), data: data.to_vec(), finish: true, content_type: String::new() }];
                let mut req = tonic::Request::new(tokio_stream::iter(chunks));
                if let Ok(v) = format!("Bearer {}", self.token).parse::<MetadataValue<tonic::metadata::Ascii>>() { req.metadata_mut().insert("authorization", v); }
                c.write(req).await.is_ok()
            })
        }

        fn grpc_delete(&self, path: &str) -> bool {
            self.rt.block_on(async { let mut c = self.client(); c.delete(self.auth_req(DeleteRequest { path: path.to_string() })).await.is_ok() })
        }

        fn grpc_mkdir(&self, path: &str) -> bool {
            self.rt.block_on(async { let mut c = self.client(); c.mkdir(self.auth_req(MkdirRequest { path: path.to_string() })).await.is_ok() })
        }

        fn make_attr(&self, ino: u64, is_dir: bool, size: u64) -> FileAttr {
            let now = SystemTime::now();
            FileAttr {
                ino, size, blocks: (size + BLOCK_SIZE as u64 - 1) / BLOCK_SIZE as u64,
                atime: now, mtime: now, ctime: now, crtime: now,
                kind: if is_dir { FileType::Directory } else { FileType::RegularFile },
                perm: if is_dir { 0o755 } else { 0o644 },
                nlink: if is_dir { 2 } else { 1 },
                uid: unsafe { libc::getuid() }, gid: unsafe { libc::getgid() },
                rdev: 0, blksize: BLOCK_SIZE, flags: 0,
            }
        }
    }

    impl Filesystem for GrpcMediaFs {
        fn lookup(&mut self, _req: &Request<'_>, parent: u64, name: &OsStr, reply: ReplyEntry) {
            let pp = match self.inodes.lock().unwrap().get_path(parent) { Some(p) => p.to_string(), None => { reply.error(libc::ENOENT); return; } };
            let ns = name.to_string_lossy();
            for e in &self.grpc_readdir(&pp) {
                if e.name == ns.as_ref() {
                    let ino = self.inodes.lock().unwrap().get_or_create(&e.gcs_path);
                    reply.entry(&TTL, &self.make_attr(ino, e.is_dir, e.size), 0); return;
                }
            }
            reply.error(libc::ENOENT);
        }
        fn getattr(&mut self, _req: &Request<'_>, ino: u64, _fh: Option<u64>, reply: ReplyAttr) {
            if ino == 1 { reply.attr(&TTL, &self.make_attr(1, true, 0)); return; }
            let path = match self.inodes.lock().unwrap().get_path(ino) { Some(p) => p.to_string(), None => { reply.error(libc::ENOENT); return; } };
            match self.grpc_stat(&path) { Some((d, s)) => reply.attr(&TTL, &self.make_attr(ino, d, s)), None => reply.error(libc::ENOENT) }
        }
        fn readdir(&mut self, _req: &Request<'_>, ino: u64, _fh: u64, offset: i64, mut reply: ReplyDirectory) {
            let path = match self.inodes.lock().unwrap().get_path(ino) { Some(p) => p.to_string(), None => { reply.error(libc::ENOENT); return; } };
            let entries = self.grpc_readdir(&path);
            let mut i = offset as usize;
            if i == 0 { if reply.add(ino, 1, FileType::Directory, ".") { reply.ok(); return; } i = 1; }
            if i == 1 { if reply.add(1, 2, FileType::Directory, "..") { reply.ok(); return; } i = 2; }
            for (idx, e) in entries.iter().enumerate() {
                let off = idx + 2; if off < i { continue; }
                let ci = self.inodes.lock().unwrap().get_or_create(&e.gcs_path);
                if reply.add(ci, (off + 1) as i64, if e.is_dir { FileType::Directory } else { FileType::RegularFile }, &e.name) { break; }
            }
            reply.ok();
        }
        fn read(&mut self, _req: &Request<'_>, ino: u64, _fh: u64, offset: i64, size: u32, _f: i32, _l: Option<u64>, reply: ReplyData) {
            let path = match self.inodes.lock().unwrap().get_path(ino) { Some(p) => p.to_string(), None => { reply.error(libc::ENOENT); return; } };
            reply.data(&self.grpc_read(&path, offset as u64, size as u64));
        }
        fn write(&mut self, _req: &Request<'_>, ino: u64, _fh: u64, _o: i64, data: &[u8], _wf: u32, _f: i32, _l: Option<u64>, reply: ReplyWrite) {
            let path = match self.inodes.lock().unwrap().get_path(ino) { Some(p) => p.to_string(), None => { reply.error(libc::ENOENT); return; } };
            if self.grpc_write(&path, data) { if let Some(i) = path.rfind('/') { self.dir_cache.lock().unwrap().remove(&path[..i]); } reply.written(data.len() as u32); }
            else { reply.error(libc::EIO); }
        }
        fn create(&mut self, _req: &Request<'_>, parent: u64, name: &OsStr, _m: u32, _u: u32, _f: i32, reply: fuser::ReplyCreate) {
            let pp = match self.inodes.lock().unwrap().get_path(parent) { Some(p) => p.to_string(), None => { reply.error(libc::ENOENT); return; } };
            let child = if pp.is_empty() { name.to_string_lossy().to_string() } else { format!("{}/{}", pp, name.to_string_lossy()) };
            if self.grpc_write(&child, &[]) {
                let ino = self.inodes.lock().unwrap().get_or_create(&child);
                self.dir_cache.lock().unwrap().remove(&pp);
                reply.created(&TTL, &self.make_attr(ino, false, 0), 0, 0, 0);
            } else { reply.error(libc::EIO); }
        }
        fn unlink(&mut self, _req: &Request<'_>, parent: u64, name: &OsStr, reply: fuser::ReplyEmpty) {
            let pp = match self.inodes.lock().unwrap().get_path(parent) { Some(p) => p.to_string(), None => { reply.error(libc::ENOENT); return; } };
            let child = if pp.is_empty() { name.to_string_lossy().to_string() } else { format!("{}/{}", pp, name.to_string_lossy()) };
            if self.grpc_delete(&child) { self.dir_cache.lock().unwrap().remove(&pp); reply.ok(); } else { reply.error(libc::EIO); }
        }
        fn mkdir(&mut self, _req: &Request<'_>, parent: u64, name: &OsStr, _m: u32, _u: u32, reply: ReplyEntry) {
            let pp = match self.inodes.lock().unwrap().get_path(parent) { Some(p) => p.to_string(), None => { reply.error(libc::ENOENT); return; } };
            let child = if pp.is_empty() { name.to_string_lossy().to_string() } else { format!("{}/{}", pp, name.to_string_lossy()) };
            if self.grpc_mkdir(&child) {
                let ino = self.inodes.lock().unwrap().get_or_create(&child);
                self.dir_cache.lock().unwrap().remove(&pp);
                reply.entry(&TTL, &self.make_attr(ino, true, 0), 0);
            } else { reply.error(libc::EIO); }
        }
    }

    pub fn do_mount(endpoint: &str, token: &str, mountpoint: &str) -> Result<(), String> {
        let rt = Runtime::new().unwrap();
        rt.block_on(async {
            let mut c = MediaFsClient::connect(endpoint.to_string()).await.map_err(|e| format!("gRPC connect: {}", e))?;
            let mut req = tonic::Request::new(ReadDirRequest { path: String::new() });
            if let Ok(v) = format!("Bearer {}", token).parse::<MetadataValue<tonic::metadata::Ascii>>() { req.metadata_mut().insert("authorization", v); }
            c.read_dir(req).await.map_err(|e| format!("Auth: {}", e))?;
            Ok::<(), String>(())
        })?;
        std::fs::create_dir_all(mountpoint).map_err(|e| format!("mkdir: {}", e))?;
        eprintln!("Mounted Sunrise Media at {}", mountpoint);
        eprintln!("  Server: {}", endpoint);
        eprintln!("  Ctrl+C to unmount");
        let fs = GrpcMediaFs::new(endpoint, token);
        fuser::mount2(fs, mountpoint, &[MountOption::FSName("sunriseobx".into()), MountOption::AutoUnmount])
            .map_err(|e| format!("FUSE: {}", e))
    }
}

pub fn mount(endpoint: &str, token: &str, mountpoint: &str) -> Result<(), String> {
    #[cfg(all(unix, feature = "fuse"))]
    { return fuse_impl::do_mount(endpoint, token, mountpoint); }

    #[cfg(not(all(unix, feature = "fuse")))]
    {
        let _ = (endpoint, token, mountpoint);
        Err("mount-media requires the 'fuse' feature. Install FUSE and rebuild with: cargo build --features fuse\nAlternatively, use: sunrise-cli media browse".into())
    }
}
