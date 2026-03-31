pub const GEOSERVER_BASE: &str = "https://gs.darecountync.gov/geoserver";
pub const MAPS_BASE: &str = "https://maps.darecountync.gov";
pub const WFS_PATH: &str = "/Production/wfs";

/// All property fields we request from the GeoServer WFS.
pub const PARCEL_PROPERTIES: &[&str] = &[
    "parcel",
    "pin14",
    "owner1",
    "owner2",
    "mailaddr1",
    "mailaddr2",
    "mailcity",
    "mailstate",
    "mailzip",
    "stnum",
    "stdir",
    "stname",
    "stsuffix",
    "stapt",
    "zipname",
    "zip",
    "subdivision",
    "lotblksec",
    "landval",
    "bldgval",
    "totval",
    "calcacre",
    "puse",
    "buildtype",
    "yearbt",
    "taxdistname",
    "zoning",
    "ownership",
];

#[derive(Debug, Clone)]
pub struct DareCountyConfig {
    pub geoserver_base: String,
    pub maps_base: String,
}

impl Default for DareCountyConfig {
    fn default() -> Self {
        Self {
            geoserver_base: GEOSERVER_BASE.to_string(),
            maps_base: MAPS_BASE.to_string(),
        }
    }
}

impl DareCountyConfig {
    pub fn wfs_url(&self) -> String {
        format!("{}{}", self.geoserver_base, WFS_PATH)
    }

    pub fn search_url(&self) -> String {
        format!("{}/searchData.php", self.maps_base)
    }

    pub fn street_search_url(&self) -> String {
        format!("{}/mailSearch.php", self.maps_base)
    }

    pub fn subdivision_search_url(&self) -> String {
        format!("{}/mailSearch2.php", self.maps_base)
    }

    pub fn owner_search_url(&self) -> String {
        format!("{}/mailSearch3.php", self.maps_base)
    }
}
