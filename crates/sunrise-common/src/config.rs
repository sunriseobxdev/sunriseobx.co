use std::collections::HashMap;

pub const DEFAULT_BASE_URL: &str = "https://api.sunriseobx.co";

#[derive(Debug, Clone)]
pub struct SunriseConfig {
    pub base_url: String,
    pub token: Option<String>,
}

impl Default for SunriseConfig {
    fn default() -> Self {
        Self {
            base_url: DEFAULT_BASE_URL.to_string(),
            token: None,
        }
    }
}

impl SunriseConfig {
    pub fn new(base_url: &str, token: Option<String>) -> Self {
        Self {
            base_url: base_url.to_string(),
            token,
        }
    }

    pub fn auth_headers(&self) -> HashMap<String, String> {
        let mut headers = HashMap::new();
        headers.insert("Content-Type".to_string(), "application/json".to_string());
        if let Some(ref token) = self.token {
            if token.starts_with("spk_") {
                headers.insert("x-api-key".to_string(), token.clone());
            } else {
                headers.insert("Authorization".to_string(), format!("Bearer {}", token));
            }
        }
        headers
    }

    pub fn url(&self, path: &str) -> String {
        format!("{}{}", self.base_url, path)
    }
}
