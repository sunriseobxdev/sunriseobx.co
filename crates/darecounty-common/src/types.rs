use serde::{Deserialize, Serialize};

/// A parcel/property record from the Dare County GIS system.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Parcel {
    pub parcel: String,
    #[serde(alias = "pin14")]
    pub pin: String,
    pub owner1: String,
    #[serde(default)]
    pub owner2: String,
    #[serde(default)]
    pub mailaddr1: String,
    #[serde(default)]
    pub mailaddr2: String,
    #[serde(default)]
    pub mailcity: String,
    #[serde(default)]
    pub mailstate: String,
    #[serde(default)]
    pub mailzip: String,
    #[serde(default)]
    pub stnum: String,
    #[serde(default)]
    pub stdir: String,
    #[serde(default)]
    pub stname: String,
    #[serde(default)]
    pub stsuffix: String,
    #[serde(default)]
    pub stapt: String,
    #[serde(default)]
    pub zipname: String,
    #[serde(default)]
    pub zip: String,
    #[serde(default)]
    pub subdivision: String,
    #[serde(default)]
    pub lotblksec: String,
    #[serde(default)]
    pub landval: String,
    #[serde(default)]
    pub bldgval: String,
    #[serde(default)]
    pub totval: String,
    #[serde(default)]
    pub calcacre: Option<f64>,
    #[serde(default)]
    pub puse: String,
    #[serde(default)]
    pub buildtype: String,
    #[serde(default)]
    pub yearbt: String,
    #[serde(default)]
    pub taxdistname: String,
    #[serde(default)]
    pub zoning: String,
    #[serde(default)]
    pub ownership: String,
}

impl Parcel {
    pub fn site_address(&self) -> String {
        [&self.stnum, &self.stdir, &self.stname, &self.stsuffix, &self.stapt]
            .iter()
            .map(|s| s.trim())
            .filter(|s| !s.is_empty())
            .collect::<Vec<_>>()
            .join(" ")
    }

    pub fn mailing_address(&self) -> String {
        let mut parts = vec![];
        let addr1 = self.mailaddr1.trim();
        let addr2 = self.mailaddr2.trim();
        if !addr1.is_empty() {
            parts.push(addr1.to_string());
        }
        if !addr2.is_empty() {
            parts.push(addr2.to_string());
        }
        let city_state_zip = format!(
            "{}, {} {}",
            self.mailcity.trim(),
            self.mailstate.trim(),
            self.mailzip.trim()
        );
        if city_state_zip.trim().len() > 2 {
            parts.push(city_state_zip);
        }
        parts.join(", ")
    }
}

/// Search result from the searchData.php autocomplete endpoint.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub value: String,
    pub id: String,
    pub lat: String,
    pub long: String,
    pub owner1: String,
    #[serde(default)]
    pub owner2: String,
    pub parcel: String,
    pub pin: String,
    pub address: String,
    #[serde(default)]
    pub subdivision: String,
    #[serde(default)]
    pub lotnum: String,
}

/// Street autocomplete result from mailSearch.php.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreetResult {
    pub label: String,
    pub value: String,
    #[serde(default)]
    pub city: String,
    #[serde(default)]
    pub stsuffix: String,
}

/// Subdivision autocomplete result from mailSearch2.php.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubdivisionResult {
    pub label: String,
    pub value: String,
}

/// Owner autocomplete result from mailSearch3.php.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OwnerResult {
    pub label: String,
    pub value: String,
    #[serde(default)]
    pub value2: String,
}

/// GeoJSON FeatureCollection response from WFS.
#[derive(Debug, Clone, Deserialize)]
pub struct FeatureCollection {
    #[serde(rename = "totalFeatures")]
    pub total_features: Option<i64>,
    pub features: Vec<Feature>,
}

/// A single GeoJSON Feature.
#[derive(Debug, Clone, Deserialize)]
pub struct Feature {
    pub id: Option<String>,
    pub properties: Parcel,
}

/// Mailing list CSV record for export.
#[derive(Debug, Clone, Serialize)]
pub struct MailingRecord {
    pub owner1: String,
    pub owner2: String,
    pub mail_address1: String,
    pub mail_address2: String,
    pub mail_city: String,
    pub mail_state: String,
    pub mail_zip: String,
    pub parcel: String,
    pub pin: String,
    pub site_address: String,
    pub subdivision: String,
    pub total_value: String,
}

impl From<&Parcel> for MailingRecord {
    fn from(p: &Parcel) -> Self {
        MailingRecord {
            owner1: p.owner1.trim().to_string(),
            owner2: p.owner2.trim().to_string(),
            mail_address1: p.mailaddr1.trim().to_string(),
            mail_address2: p.mailaddr2.trim().to_string(),
            mail_city: p.mailcity.trim().to_string(),
            mail_state: p.mailstate.trim().to_string(),
            mail_zip: p.mailzip.trim().to_string(),
            parcel: p.parcel.trim().to_string(),
            pin: p.pin.trim().to_string(),
            site_address: p.site_address(),
            subdivision: p.subdivision.trim().to_string(),
            total_value: p.totval.trim().to_string(),
        }
    }
}
