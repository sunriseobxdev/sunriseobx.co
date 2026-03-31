use crate::config::{DareCountyConfig, PARCEL_PROPERTIES};
use crate::error::DareCountyError;
use crate::transport::{HttpRequest, HttpTransport, Method};
use crate::types::*;
use std::collections::HashMap;

pub struct DareCountyClient<T: HttpTransport> {
    config: DareCountyConfig,
    transport: T,
}

impl<T: HttpTransport> DareCountyClient<T> {
    pub fn new(config: DareCountyConfig, transport: T) -> Self {
        Self { config, transport }
    }

    async fn get(
        &self,
        url: &str,
        query: Vec<(String, String)>,
    ) -> Result<String, DareCountyError> {
        let resp = self
            .transport
            .execute(HttpRequest {
                method: Method::Get,
                url: url.to_string(),
                headers: HashMap::new(),
                body: None,
                query,
            })
            .await?;

        if resp.status >= 200 && resp.status < 300 {
            Ok(resp.body)
        } else {
            Err(DareCountyError::Http {
                status: resp.status,
                body: resp.body,
            })
        }
    }

    #[allow(dead_code)]
    async fn post(
        &self,
        url: &str,
        body: String,
        headers: HashMap<String, String>,
    ) -> Result<String, DareCountyError> {
        let resp = self
            .transport
            .execute(HttpRequest {
                method: Method::Post,
                url: url.to_string(),
                headers,
                body: Some(body),
                query: vec![],
            })
            .await?;

        if resp.status >= 200 && resp.status < 300 {
            Ok(resp.body)
        } else {
            Err(DareCountyError::Http {
                status: resp.status,
                body: resp.body,
            })
        }
    }

    // ── Autocomplete / Search endpoints ──

    /// Search parcels by parcel number, PIN, owner name, or address.
    /// Returns up to 100 results from the searchData.php autocomplete.
    pub async fn search(&self, term: &str) -> Result<Vec<SearchResult>, DareCountyError> {
        let body = self
            .get(
                &self.config.search_url(),
                vec![("term".into(), term.into())],
            )
            .await?;
        Ok(serde_json::from_str(&body)?)
    }

    /// Search for street names (autocomplete).
    pub async fn search_streets(&self, term: &str) -> Result<Vec<StreetResult>, DareCountyError> {
        let body = self
            .get(
                &self.config.street_search_url(),
                vec![("term".into(), term.into())],
            )
            .await?;
        Ok(serde_json::from_str(&body)?)
    }

    /// Search for subdivision names (autocomplete).
    pub async fn search_subdivisions(
        &self,
        term: &str,
    ) -> Result<Vec<SubdivisionResult>, DareCountyError> {
        let body = self
            .get(
                &self.config.subdivision_search_url(),
                vec![("term".into(), term.into())],
            )
            .await?;
        Ok(serde_json::from_str(&body)?)
    }

    /// Search for owner names (autocomplete).
    pub async fn search_owners(&self, term: &str) -> Result<Vec<OwnerResult>, DareCountyError> {
        let body = self
            .get(
                &self.config.owner_search_url(),
                vec![("term".into(), term.into())],
            )
            .await?;
        Ok(serde_json::from_str(&body)?)
    }

    // ── GeoServer WFS queries ──

    fn wfs_query(
        &self,
        cql_filter: Option<&str>,
        max_features: u32,
        start_index: u32,
    ) -> Vec<(String, String)> {
        let mut params = vec![
            ("service".into(), "WFS".into()),
            ("version".into(), "1.1.0".into()),
            ("request".into(), "GetFeature".into()),
            ("typeName".into(), "Production:gis_polygons".into()),
            ("outputFormat".into(), "application/json".into()),
            (
                "propertyName".into(),
                PARCEL_PROPERTIES.join(","),
            ),
            ("maxFeatures".into(), max_features.to_string()),
            ("startIndex".into(), start_index.to_string()),
        ];
        if let Some(filter) = cql_filter {
            params.push(("CQL_FILTER".into(), filter.into()));
        }
        params
    }

    async fn wfs_get_features(
        &self,
        cql_filter: Option<&str>,
        max_features: u32,
        start_index: u32,
    ) -> Result<FeatureCollection, DareCountyError> {
        let query = self.wfs_query(cql_filter, max_features, start_index);
        let body = self.get(&self.config.wfs_url(), query).await?;
        Ok(serde_json::from_str(&body)?)
    }

    /// Fetch parcels with optional CQL filter, paginating through all results.
    /// Calls `on_progress(fetched_so_far)` after each page.
    pub async fn query_parcels_with_progress(
        &self,
        cql_filter: Option<&str>,
        on_progress: impl Fn(usize),
    ) -> Result<Vec<Parcel>, DareCountyError> {
        let page_size = 1000;
        let mut all_parcels = Vec::new();
        let mut start_index = 0u32;

        loop {
            let fc = self
                .wfs_get_features(cql_filter, page_size, start_index)
                .await?;
            let count = fc.features.len();
            for f in fc.features {
                all_parcels.push(f.properties);
            }
            on_progress(all_parcels.len());
            if count < page_size as usize {
                break;
            }
            start_index += page_size;
        }

        Ok(all_parcels)
    }

    /// Fetch all parcels matching a CQL filter, paginating through results.
    pub async fn query_parcels(
        &self,
        cql_filter: &str,
    ) -> Result<Vec<Parcel>, DareCountyError> {
        self.query_parcels_with_progress(Some(cql_filter), |_| {})
            .await
    }

    /// Fetch every parcel in the county (~48k records), paginating automatically.
    pub async fn all_parcels(
        &self,
        on_progress: impl Fn(usize),
    ) -> Result<Vec<Parcel>, DareCountyError> {
        self.query_parcels_with_progress(None, on_progress).await
    }

    /// Get a single parcel by parcel number.
    pub async fn get_parcel(&self, parcel_number: &str) -> Result<Option<Parcel>, DareCountyError> {
        let filter = format!("parcel='{}'", parcel_number);
        let fc = self.wfs_get_features(Some(&filter), 1, 0).await?;
        Ok(fc.features.into_iter().next().map(|f| f.properties))
    }

    /// Get all parcels for a given owner name (LIKE match).
    pub async fn parcels_by_owner(&self, owner: &str) -> Result<Vec<Parcel>, DareCountyError> {
        let filter = format!("owner1 LIKE '%{}%'", owner.to_uppercase().replace('\'', "''"));
        self.query_parcels(&filter).await
    }

    /// Get all parcels on a given street.
    pub async fn parcels_by_street(
        &self,
        street_name: &str,
    ) -> Result<Vec<Parcel>, DareCountyError> {
        let filter = format!(
            "stname LIKE '%{}%'",
            street_name.to_uppercase().replace('\'', "''")
        );
        self.query_parcels(&filter).await
    }

    /// Get all parcels in a given subdivision.
    pub async fn parcels_by_subdivision(
        &self,
        subdivision: &str,
    ) -> Result<Vec<Parcel>, DareCountyError> {
        let filter = format!(
            "subdivision LIKE '%{}%'",
            subdivision.to_uppercase().replace('\'', "''")
        );
        self.query_parcels(&filter).await
    }

    /// Get all parcels in a given town/zip name.
    pub async fn parcels_by_town(&self, town: &str) -> Result<Vec<Parcel>, DareCountyError> {
        let filter = format!(
            "zipname LIKE '%{}%'",
            town.to_uppercase().replace('\'', "''")
        );
        self.query_parcels(&filter).await
    }

    /// Run a raw CQL filter query against the WFS.
    pub async fn parcels_by_cql(&self, cql: &str) -> Result<Vec<Parcel>, DareCountyError> {
        self.query_parcels(cql).await
    }
}
