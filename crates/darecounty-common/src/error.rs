use thiserror::Error;

#[derive(Debug, Error)]
pub enum DareCountyError {
    #[error("HTTP {status}: {body}")]
    Http { status: u16, body: String },

    #[error("Transport: {0}")]
    Transport(String),

    #[error("Deserialize: {0}")]
    Deserialize(String),

    #[error("Invalid parameter: {0}")]
    InvalidParam(String),

    #[error("{0}")]
    Other(String),
}

impl From<serde_json::Error> for DareCountyError {
    fn from(e: serde_json::Error) -> Self {
        DareCountyError::Deserialize(e.to_string())
    }
}

impl From<url::ParseError> for DareCountyError {
    fn from(e: url::ParseError) -> Self {
        DareCountyError::Other(e.to_string())
    }
}
