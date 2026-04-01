use sunrise_common::error::SunriseError;
use sunrise_common::transport::{HttpRequest, HttpResponse, HttpTransport, Method};
use std::collections::HashMap;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;
use web_sys::{Request, RequestInit, Response};

pub struct FetchTransport;

fn get_global_this() -> js_sys::Object {
    js_sys::Reflect::get(&js_sys::global(), &JsValue::from_str("self"))
        .unwrap_or(js_sys::global().into())
        .unchecked_into()
}

#[async_trait::async_trait(?Send)]
impl HttpTransport for FetchTransport {
    async fn execute(&self, request: HttpRequest) -> Result<HttpResponse, SunriseError> {
        let method_str = match request.method {
            Method::Get => "GET",
            Method::Post => "POST",
            Method::Put => "PUT",
            Method::Delete => "DELETE",
        };

        let mut url = request.url.clone();
        if !request.query.is_empty() {
            let qs: Vec<String> = request
                .query
                .iter()
                .map(|(k, v)| {
                    format!(
                        "{}={}",
                        js_sys::encode_uri_component(k),
                        js_sys::encode_uri_component(v)
                    )
                })
                .collect();
            url = format!("{}?{}", url, qs.join("&"));
        }

        let opts = RequestInit::new();
        opts.set_method(method_str);

        if let Some(body) = &request.body {
            opts.set_body(&JsValue::from_str(body));
        }

        let headers = web_sys::Headers::new()
            .map_err(|e| SunriseError::Transport(format!("{:?}", e)))?;
        for (k, v) in &request.headers {
            headers
                .set(k, v)
                .map_err(|e| SunriseError::Transport(format!("{:?}", e)))?;
        }
        opts.set_headers(&headers);

        let req = Request::new_with_str_and_init(&url, &opts)
            .map_err(|e| SunriseError::Transport(format!("{:?}", e)))?;

        let global = get_global_this();
        let fetch_fn = js_sys::Reflect::get(&global, &JsValue::from_str("fetch"))
            .map_err(|e| SunriseError::Transport(format!("{:?}", e)))?;
        let fetch_promise = js_sys::Function::from(fetch_fn)
            .call1(&global, &req)
            .map_err(|e| SunriseError::Transport(format!("{:?}", e)))?;

        let resp_value = JsFuture::from(js_sys::Promise::from(fetch_promise))
            .await
            .map_err(|e| SunriseError::Transport(format!("{:?}", e)))?;

        let resp: Response = resp_value.unchecked_into();
        let status = resp.status();

        let text_promise = resp
            .text()
            .map_err(|e| SunriseError::Transport(format!("{:?}", e)))?;
        let text_value = JsFuture::from(text_promise)
            .await
            .map_err(|e| SunriseError::Transport(format!("{:?}", e)))?;
        let body = text_value.as_string().unwrap_or_default();

        Ok(HttpResponse {
            status,
            body,
            headers: HashMap::new(),
        })
    }
}
