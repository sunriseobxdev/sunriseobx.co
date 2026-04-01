use sunrise_common::error::SunriseError;
use sunrise_common::transport::{HttpRequest, HttpResponse, HttpTransport, Method};
use std::collections::HashMap;

pub struct ReqwestTransport {
    client: reqwest::Client,
}

impl ReqwestTransport {
    pub fn new() -> Self {
        Self {
            client: reqwest::Client::new(),
        }
    }
}

impl Default for ReqwestTransport {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait::async_trait(?Send)]
impl HttpTransport for ReqwestTransport {
    async fn execute(&self, request: HttpRequest) -> Result<HttpResponse, SunriseError> {
        let method = match request.method {
            Method::Get => reqwest::Method::GET,
            Method::Post => reqwest::Method::POST,
            Method::Put => reqwest::Method::PUT,
            Method::Delete => reqwest::Method::DELETE,
        };

        let mut builder = self.client.request(method, &request.url);

        if !request.query.is_empty() {
            builder = builder.query(&request.query);
        }

        for (key, value) in &request.headers {
            builder = builder.header(key, value);
        }

        if let Some(body) = request.body {
            builder = builder.body(body);
        }

        let resp = builder
            .send()
            .await
            .map_err(|e| SunriseError::Transport(e.to_string()))?;

        let status = resp.status().as_u16();
        let headers: HashMap<String, String> = resp
            .headers()
            .iter()
            .map(|(k, v)| (k.to_string(), v.to_str().unwrap_or("").to_string()))
            .collect();
        let body = resp
            .text()
            .await
            .map_err(|e| SunriseError::Transport(e.to_string()))?;

        Ok(HttpResponse {
            status,
            body,
            headers,
        })
    }
}
