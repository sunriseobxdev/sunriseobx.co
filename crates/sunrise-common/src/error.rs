use thiserror::Error;

#[derive(Debug, Error)]
pub enum SunriseError {
    #[error("HTTP {status}: {body}")]
    Http { status: u16, body: String },

    #[error("Unauthorized: {0}")]
    Auth(String),

    #[error("Transport: {0}")]
    Transport(String),

    #[error("Deserialize: {0}")]
    Deserialize(String),

    #[error("{0}")]
    Other(String),
}

impl From<serde_json::Error> for SunriseError {
    fn from(e: serde_json::Error) -> Self {
        SunriseError::Deserialize(e.to_string())
    }
}

impl From<url::ParseError> for SunriseError {
    fn from(e: url::ParseError) -> Self {
        SunriseError::Other(e.to_string())
    }
}
