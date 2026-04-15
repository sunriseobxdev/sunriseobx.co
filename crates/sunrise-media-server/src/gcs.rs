use reqwest::Client;
use serde::Deserialize;
use std::sync::Mutex;
use std::time::{Duration, Instant};

/// GCS JSON API client. Uses GKE metadata server for tokens, or falls back
/// to GOOGLE_APPLICATION_CREDENTIALS.
pub struct GcsClient {
    bucket: String,
    http: Client,
    token_cache: Mutex<(String, Instant)>,
}

#[derive(Debug, Deserialize)]
struct GcsObject {
    name: String,
    size: Option<String>,
    #[serde(rename = "contentType")]
    content_type: Option<String>,
    updated: Option<String>,
    #[serde(rename = "timeCreated")]
    time_created: Option<String>,
}

#[derive(Debug, Deserialize)]
struct GcsListResponse {
    #[serde(default)]
    items: Vec<GcsObject>,
    #[serde(default)]
    prefixes: Vec<String>,
}

#[derive(Debug, Deserialize)]
struct MetadataToken {
    access_token: String,
    expires_in: u64,
}

impl GcsClient {
    pub fn new(bucket: &str) -> Self {
        let client = Client::builder().timeout(Duration::from_secs(10)).build().unwrap();
        Self {
            bucket: bucket.to_string(),
            http: client,
            token_cache: Mutex::new((String::new(), Instant::now())),
        }
    }

    async fn token(&self) -> String {
        // Check cache
        {
            let cache = self.token_cache.lock().unwrap();
            if !cache.0.is_empty() && cache.1.elapsed() < Duration::from_secs(300) {
                return cache.0.clone();
            }
        }

        // Try GKE metadata server first
        let token = match self.http
            .get("http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token")
            .header("Metadata-Flavor", "Google")
            .timeout(Duration::from_secs(3))
            .send().await
        {
            Ok(resp) if resp.status().is_success() => {
                match resp.json::<MetadataToken>().await {
                    Ok(t) => Some(t.access_token),
                    Err(_) => None,
                }
            }
            _ => None,
        };

        let token = match token {
            Some(t) => t,
            None => {
                eprintln!("Metadata server unreachable — no token available");
                return String::new();
            }
        };

        let mut cache = self.token_cache.lock().unwrap();
        *cache = (token.clone(), Instant::now());
        token
    }

    pub async fn stat(&self, path: &str) -> Option<(bool, u64, String)> {
        let clean = path.trim_matches('/');
        if !clean.is_empty() {
            let url = format!("https://storage.googleapis.com/storage/v1/b/{}/o/{}", self.bucket, urlenc(clean));
            if let Ok(resp) = self.http.get(&url).bearer_auth(self.token().await).send().await {
                if resp.status().is_success() {
                    if let Ok(obj) = resp.json::<GcsObject>().await {
                        let size = obj.size.and_then(|s| s.parse().ok()).unwrap_or(0);
                        let modified = obj.updated.or(obj.time_created).unwrap_or_default();
                        return Some((false, size, modified));
                    }
                }
            }
        }
        let prefix = if clean.is_empty() { String::new() } else { format!("{}/", clean) };
        let url = format!("https://storage.googleapis.com/storage/v1/b/{}/o", self.bucket);
        if let Ok(resp) = self.http.get(&url).bearer_auth(self.token().await)
            .query(&[("prefix", &prefix), ("delimiter", &"/".to_string()), ("maxResults", &"1".to_string())])
            .send().await
        {
            if resp.status().is_success() {
                if let Ok(list) = resp.json::<GcsListResponse>().await {
                    if !list.items.is_empty() || !list.prefixes.is_empty() || clean.is_empty() {
                        return Some((true, 0, chrono::Utc::now().to_rfc3339()));
                    }
                }
            }
        }
        None
    }

    pub async fn readdir(&self, path: &str) -> Vec<(String, bool, u64)> {
        let clean = path.trim_matches('/');
        let prefix = if clean.is_empty() { String::new() } else { format!("{}/", clean) };
        let url = format!("https://storage.googleapis.com/storage/v1/b/{}/o", self.bucket);
        let resp = match self.http.get(&url).bearer_auth(self.token().await)
            .query(&[("prefix", &prefix), ("delimiter", &"/".to_string())])
            .send().await
        {
            Ok(r) if r.status().is_success() => r,
            _ => return vec![],
        };
        let list: GcsListResponse = match resp.json().await { Ok(l) => l, Err(_) => return vec![] };
        let mut entries = Vec::new();
        for p in &list.prefixes {
            let name = p.strip_prefix(&prefix).unwrap_or(p).trim_end_matches('/');
            if !name.is_empty() { entries.push((name.to_string(), true, 0)); }
        }
        for obj in &list.items {
            let name = obj.name.strip_prefix(&prefix).unwrap_or(&obj.name);
            if name.is_empty() || name.contains('/') || name == ".keep" { continue; }
            let size = obj.size.as_ref().and_then(|s| s.parse().ok()).unwrap_or(0);
            entries.push((name.to_string(), false, size));
        }
        entries
    }

    pub async fn read(&self, path: &str, offset: u64, size: u64) -> Option<Vec<u8>> {
        let clean = path.trim_matches('/');
        let url = format!("https://storage.googleapis.com/storage/v1/b/{}/o/{}?alt=media", self.bucket, urlenc(clean));
        let mut req = self.http.get(&url).bearer_auth(self.token().await);
        if size > 0 { req = req.header("Range", format!("bytes={}-{}", offset, offset + size - 1)); }
        match req.send().await {
            Ok(r) if r.status().is_success() || r.status().as_u16() == 206 => r.bytes().await.ok().map(|b| b.to_vec()),
            _ => None,
        }
    }

    pub async fn write(&self, path: &str, data: &[u8]) -> bool {
        let clean = path.trim_matches('/');
        let url = format!("https://storage.googleapis.com/upload/storage/v1/b/{}/o?uploadType=media&name={}", self.bucket, urlenc(clean));
        matches!(
            self.http.post(&url).bearer_auth(self.token().await).header("Content-Type", "application/octet-stream").body(data.to_vec()).send().await,
            Ok(r) if r.status().is_success()
        )
    }

    pub async fn delete(&self, path: &str) -> bool {
        let clean = path.trim_matches('/');
        let url = format!("https://storage.googleapis.com/storage/v1/b/{}/o/{}", self.bucket, urlenc(clean));
        matches!(self.http.delete(&url).bearer_auth(self.token().await).send().await, Ok(r) if r.status().is_success() || r.status().as_u16() == 404)
    }

    pub async fn mkdir(&self, path: &str) -> bool {
        self.write(&format!("{}/.keep", path.trim_matches('/')), b"").await
    }
}

fn urlenc(s: &str) -> String {
    s.bytes().map(|b| match b {
        b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' => (b as char).to_string(),
        b'/' => "%2F".to_string(),
        _ => format!("%{:02X}", b),
    }).collect()
}
