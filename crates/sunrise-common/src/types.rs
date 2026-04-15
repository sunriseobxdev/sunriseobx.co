use serde::{Deserialize, Serialize};

// --- Auth ---

#[derive(Debug, Serialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginResponse {
    pub token: Option<String>,
    pub pending_2fa: Option<bool>,
    pub pending_token: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct Login2faRequest {
    pub pending_token: String,
    pub code: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserProfile {
    pub id: String,
    pub email: String,
    pub display_name: Option<String>,
    pub role: String,
    pub privileges: serde_json::Value,
    pub totp_enabled: Option<bool>,
}

// --- IAM ---

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub email: String,
    pub display_name: Option<String>,
    pub role: String,
    pub privileges: serde_json::Value,
    pub disabled: Option<bool>,
    pub created_at: Option<String>,
    pub last_login: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct CreateUserRequest {
    pub email: String,
    pub password: String,
    pub display_name: Option<String>,
    pub role: Option<String>,
    pub privileges: Option<Vec<String>>,
}

#[derive(Debug, Serialize)]
pub struct UpdateUserRequest {
    pub role: Option<String>,
    pub display_name: Option<String>,
    pub disabled: Option<bool>,
    pub privileges: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuditEntry {
    pub id: String,
    pub user_id: Option<String>,
    pub action: String,
    pub resource: Option<String>,
    pub details: Option<serde_json::Value>,
    pub ip_address: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Session {
    pub id: String,
    pub user_id: String,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub created_at: String,
    pub expires_at: String,
}

// --- CMS ---

#[derive(Debug, Serialize, Deserialize)]
pub struct CmsPost {
    pub id: String,
    pub slug: String,
    pub title: String,
    pub excerpt: Option<String>,
    pub content: Option<serde_json::Value>,
    pub image_url: Option<String>,
    pub status: String,
    pub published_at: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct CreatePostRequest {
    pub slug: String,
    pub title: String,
    pub excerpt: Option<String>,
    pub content: Option<serde_json::Value>,
    pub image_url: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct UpdatePostRequest {
    pub slug: Option<String>,
    pub title: Option<String>,
    pub excerpt: Option<String>,
    pub content: Option<serde_json::Value>,
    pub image_url: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CmsProject {
    pub id: String,
    pub slug: String,
    pub title: String,
    pub description: Option<String>,
    pub images: Option<serde_json::Value>,
    pub services: Option<String>,
    pub location: Option<String>,
    pub status: String,
    pub featured: Option<bool>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct CreateProjectRequest {
    pub slug: String,
    pub title: String,
    pub description: Option<String>,
    pub images: Option<serde_json::Value>,
    pub services: Option<String>,
    pub location: Option<String>,
    pub status: Option<String>,
    pub featured: Option<bool>,
}

// --- Payroll ---

#[derive(Debug, Serialize, Deserialize)]
pub struct Employee {
    pub id: String,
    pub employee_id: String,
    pub full_name: String,
    pub email: Option<String>,
    pub annual_salary: Option<f64>,
    pub pay_frequency: Option<String>,
    pub department: Option<String>,
    pub title: Option<String>,
    pub start_date: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct CreateEmployeeRequest {
    pub employee_id: String,
    pub full_name: String,
    pub email: Option<String>,
    pub annual_salary: f64,
    pub pay_frequency: Option<String>,
    pub filing_status: Option<String>,
    pub start_date: String,
    pub department: Option<String>,
    pub title: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Paystub {
    pub id: String,
    pub stub_number: i32,
    pub pay_date: String,
    pub period_start: String,
    pub period_end: String,
    pub gross_pay: Option<f64>,
    pub net_pay: Option<f64>,
    pub pdf_path: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct GeneratePaystubsRequest {
    pub year: i32,
}

// --- Invoices ---

#[derive(Debug, Serialize, Deserialize)]
pub struct Invoice {
    pub id: String,
    pub invoice_number: String,
    pub client_name: String,
    pub client_email: Option<String>,
    pub issue_date: String,
    pub due_date: String,
    pub total: Option<serde_json::Value>,
    pub status: String,
    pub pdf_path: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateInvoiceRequest {
    pub invoice_number: String,
    pub client_name: String,
    pub client_email: Option<String>,
    pub client_address: Option<String>,
    pub issue_date: String,
    pub due_date: String,
    pub line_items: serde_json::Value,
    pub tax_rate: Option<f64>,
    pub notes: Option<String>,
    pub status: Option<String>,
}

// --- Campaigns ---

#[derive(Debug, Serialize, Deserialize)]
pub struct Campaign {
    pub id: String,
    pub name: String,
    pub subject: Option<String>,
    pub status: String,
    pub total_recipients: Option<i32>,
    pub total_sent: Option<i32>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct CreateCampaignRequest {
    pub name: String,
    pub subject: Option<String>,
    pub body_html: Option<String>,
    pub filter_type: Option<String>,
    pub filter_value: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct PopulateCampaignRequest {
    pub filter_type: Option<String>,
    pub filter_value: Option<String>,
    pub min_value: Option<f64>,
    pub max_value: Option<f64>,
    pub town: Option<String>,
    pub out_of_state: Option<bool>,
}

// --- Parcels ---

#[derive(Debug, Serialize, Deserialize)]
pub struct ParcelRecord {
    pub id: Option<i64>,
    pub parcel: String,
    pub owner1: Option<String>,
    pub owner2: Option<String>,
    pub stname: Option<String>,
    pub zipname: Option<String>,
    pub subdivision: Option<String>,
    pub totval: Option<f64>,
    pub puse: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ParcelStats {
    pub total: Option<i64>,
    pub towns: Option<serde_json::Value>,
}

// --- Trading ---

#[derive(Debug, Serialize, Deserialize)]
pub struct Account {
    pub id: Option<String>,
    pub account_number: Option<String>,
    pub status: Option<String>,
    pub equity: Option<String>,
    pub cash: Option<String>,
    pub buying_power: Option<String>,
    pub portfolio_value: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Position {
    pub symbol: String,
    pub qty: Option<String>,
    pub avg_entry_price: Option<String>,
    pub current_price: Option<String>,
    pub market_value: Option<String>,
    pub unrealized_pl: Option<String>,
    pub unrealized_plpc: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct CreateOrderRequest {
    pub symbol: String,
    pub qty: Option<String>,
    pub notional: Option<String>,
    pub side: String,
    #[serde(rename = "type")]
    pub order_type: String,
    pub time_in_force: String,
    pub limit_price: Option<String>,
    pub stop_price: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Order {
    pub id: String,
    pub symbol: String,
    pub qty: Option<String>,
    pub side: Option<String>,
    #[serde(rename = "type")]
    pub order_type: Option<String>,
    pub status: Option<String>,
    pub filled_avg_price: Option<String>,
    pub created_at: Option<String>,
}

// --- API Keys ---

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiKey {
    pub id: String,
    pub name: String,
    pub key_prefix: String,
    pub last_used: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct CreateApiKeyRequest {
    pub name: String,
    pub expires_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateApiKeyResponse {
    pub id: String,
    pub key: String,
    pub name: String,
}

// --- Media / Filesystem ---

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MediaEntry {
    pub name: String,
    #[serde(rename = "type")]
    pub entry_type: String,
    pub path: Option<String>,
    pub url: Option<String>,
    pub size: Option<u64>,
    #[serde(rename = "contentType")]
    pub content_type: Option<String>,
    pub updated: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MediaBrowseResponse {
    pub prefix: String,
    pub entries: Vec<MediaEntry>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FsStatResponse {
    #[serde(rename = "type")]
    pub entry_type: String,
    pub size: u64,
    pub modified: String,
    #[serde(rename = "contentType")]
    pub content_type: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FsDirEntry {
    pub name: String,
    #[serde(rename = "type")]
    pub entry_type: String,
    pub size: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FsReaddirResponse {
    pub entries: Vec<FsDirEntry>,
}

// --- Generic ---

#[derive(Debug, Serialize, Deserialize)]
pub struct SuccessResponse {
    pub success: Option<bool>,
    pub message: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PdfUrlResponse {
    pub url: String,
}
