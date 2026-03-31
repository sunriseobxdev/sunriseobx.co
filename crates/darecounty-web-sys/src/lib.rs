pub mod http;

use darecounty_common::client::DareCountyClient;
use darecounty_common::config::DareCountyConfig;
use http::FetchTransport;
use wasm_bindgen::prelude::*;

fn to_js_error(e: darecounty_common::error::DareCountyError) -> JsError {
    JsError::new(&e.to_string())
}

#[wasm_bindgen]
pub struct WasmDareCountyClient {
    inner: DareCountyClient<FetchTransport>,
}

#[wasm_bindgen]
impl WasmDareCountyClient {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            inner: DareCountyClient::new(DareCountyConfig::default(), FetchTransport),
        }
    }

    #[wasm_bindgen(js_name = search)]
    pub async fn search(&self, term: &str) -> Result<JsValue, JsError> {
        let results = self.inner.search(term).await.map_err(to_js_error)?;
        Ok(serde_wasm_bindgen::to_value(&results)?)
    }

    #[wasm_bindgen(js_name = searchOwners)]
    pub async fn search_owners(&self, term: &str) -> Result<JsValue, JsError> {
        let results = self.inner.search_owners(term).await.map_err(to_js_error)?;
        Ok(serde_wasm_bindgen::to_value(&results)?)
    }

    #[wasm_bindgen(js_name = searchStreets)]
    pub async fn search_streets(&self, term: &str) -> Result<JsValue, JsError> {
        let results = self.inner.search_streets(term).await.map_err(to_js_error)?;
        Ok(serde_wasm_bindgen::to_value(&results)?)
    }

    #[wasm_bindgen(js_name = searchSubdivisions)]
    pub async fn search_subdivisions(&self, term: &str) -> Result<JsValue, JsError> {
        let results = self
            .inner
            .search_subdivisions(term)
            .await
            .map_err(to_js_error)?;
        Ok(serde_wasm_bindgen::to_value(&results)?)
    }

    #[wasm_bindgen(js_name = getParcel)]
    pub async fn get_parcel(&self, parcel_number: &str) -> Result<JsValue, JsError> {
        let result = self
            .inner
            .get_parcel(parcel_number)
            .await
            .map_err(to_js_error)?;
        Ok(serde_wasm_bindgen::to_value(&result)?)
    }

    #[wasm_bindgen(js_name = parcelsByOwner)]
    pub async fn parcels_by_owner(&self, owner: &str) -> Result<JsValue, JsError> {
        let results = self
            .inner
            .parcels_by_owner(owner)
            .await
            .map_err(to_js_error)?;
        Ok(serde_wasm_bindgen::to_value(&results)?)
    }

    #[wasm_bindgen(js_name = parcelsByStreet)]
    pub async fn parcels_by_street(&self, street: &str) -> Result<JsValue, JsError> {
        let results = self
            .inner
            .parcels_by_street(street)
            .await
            .map_err(to_js_error)?;
        Ok(serde_wasm_bindgen::to_value(&results)?)
    }

    #[wasm_bindgen(js_name = parcelsBySubdivision)]
    pub async fn parcels_by_subdivision(&self, subdivision: &str) -> Result<JsValue, JsError> {
        let results = self
            .inner
            .parcels_by_subdivision(subdivision)
            .await
            .map_err(to_js_error)?;
        Ok(serde_wasm_bindgen::to_value(&results)?)
    }

    #[wasm_bindgen(js_name = parcelsByTown)]
    pub async fn parcels_by_town(&self, town: &str) -> Result<JsValue, JsError> {
        let results = self
            .inner
            .parcels_by_town(town)
            .await
            .map_err(to_js_error)?;
        Ok(serde_wasm_bindgen::to_value(&results)?)
    }

    #[wasm_bindgen(js_name = parcelsByCql)]
    pub async fn parcels_by_cql(&self, cql: &str) -> Result<JsValue, JsError> {
        let results = self
            .inner
            .parcels_by_cql(cql)
            .await
            .map_err(to_js_error)?;
        Ok(serde_wasm_bindgen::to_value(&results)?)
    }
}
