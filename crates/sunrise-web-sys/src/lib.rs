pub mod http;

use sunrise_common::client::SunriseClient;
use sunrise_common::config::SunriseConfig;
use http::FetchTransport;
use wasm_bindgen::prelude::*;

fn to_js_error(e: sunrise_common::error::SunriseError) -> JsError {
    JsError::new(&e.to_string())
}

#[wasm_bindgen]
pub struct WasmSunriseClient {
    inner: SunriseClient<FetchTransport>,
}

#[wasm_bindgen]
impl WasmSunriseClient {
    #[wasm_bindgen(constructor)]
    pub fn new(base_url: &str, token: Option<String>) -> Self {
        Self {
            inner: SunriseClient::new(
                SunriseConfig::new(base_url, token),
                FetchTransport,
            ),
        }
    }

    #[wasm_bindgen(js_name = setToken)]
    pub fn set_token(&mut self, token: String) {
        self.inner.config.token = Some(token);
    }

    // --- Auth ---

    #[wasm_bindgen(js_name = login)]
    pub async fn login(&self, email: &str, password: &str) -> Result<JsValue, JsError> {
        let resp = self.inner.auth_login(email, password).await.map_err(to_js_error)?;
        Ok(serde_wasm_bindgen::to_value(&resp)?)
    }

    #[wasm_bindgen(js_name = me)]
    pub async fn me(&self) -> Result<JsValue, JsError> {
        let resp = self.inner.auth_me().await.map_err(to_js_error)?;
        Ok(serde_wasm_bindgen::to_value(&resp)?)
    }

    // --- CMS ---

    #[wasm_bindgen(js_name = listPosts)]
    pub async fn list_posts(&self) -> Result<JsValue, JsError> {
        let resp = self.inner.cms_list_posts().await.map_err(to_js_error)?;
        Ok(serde_wasm_bindgen::to_value(&resp)?)
    }

    #[wasm_bindgen(js_name = deletePost)]
    pub async fn delete_post(&self, id: &str) -> Result<JsValue, JsError> {
        let resp = self.inner.cms_delete_post(id).await.map_err(to_js_error)?;
        Ok(serde_wasm_bindgen::to_value(&resp)?)
    }

    // --- IAM ---

    #[wasm_bindgen(js_name = listUsers)]
    pub async fn list_users(&self) -> Result<JsValue, JsError> {
        let resp = self.inner.iam_list_users().await.map_err(to_js_error)?;
        Ok(serde_wasm_bindgen::to_value(&resp)?)
    }

    // --- Payroll ---

    #[wasm_bindgen(js_name = listEmployees)]
    pub async fn list_employees(&self) -> Result<JsValue, JsError> {
        let resp = self.inner.payroll_list_employees().await.map_err(to_js_error)?;
        Ok(serde_wasm_bindgen::to_value(&resp)?)
    }

    // --- Invoices ---

    #[wasm_bindgen(js_name = listInvoices)]
    pub async fn list_invoices(&self) -> Result<JsValue, JsError> {
        let resp = self.inner.invoices_list().await.map_err(to_js_error)?;
        Ok(serde_wasm_bindgen::to_value(&resp)?)
    }

    // --- Campaigns ---

    #[wasm_bindgen(js_name = listCampaigns)]
    pub async fn list_campaigns(&self) -> Result<JsValue, JsError> {
        let resp = self.inner.campaigns_list().await.map_err(to_js_error)?;
        Ok(serde_wasm_bindgen::to_value(&resp)?)
    }

    // --- Parcels ---

    #[wasm_bindgen(js_name = parcelsSearch)]
    pub async fn parcels_search(&self, q: &str) -> Result<JsValue, JsError> {
        let resp = self.inner.parcels_search(q).await.map_err(to_js_error)?;
        Ok(serde_wasm_bindgen::to_value(&resp)?)
    }

    #[wasm_bindgen(js_name = parcelsStats)]
    pub async fn parcels_stats(&self) -> Result<JsValue, JsError> {
        let resp = self.inner.parcels_stats().await.map_err(to_js_error)?;
        Ok(serde_wasm_bindgen::to_value(&resp)?)
    }

    // --- Trading ---

    #[wasm_bindgen(js_name = tradingAccount)]
    pub async fn trading_account(&self) -> Result<JsValue, JsError> {
        let resp = self.inner.trading_account().await.map_err(to_js_error)?;
        Ok(serde_wasm_bindgen::to_value(&resp)?)
    }

    #[wasm_bindgen(js_name = tradingPositions)]
    pub async fn trading_positions(&self) -> Result<JsValue, JsError> {
        let resp = self.inner.trading_positions().await.map_err(to_js_error)?;
        Ok(serde_wasm_bindgen::to_value(&resp)?)
    }

    // --- Market ---

    #[wasm_bindgen(js_name = marketOverview)]
    pub async fn market_overview(&self) -> Result<JsValue, JsError> {
        let resp = self.inner.market_overview().await.map_err(to_js_error)?;
        Ok(serde_wasm_bindgen::to_value(&resp)?)
    }
}
