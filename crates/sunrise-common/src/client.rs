use crate::config::SunriseConfig;
use crate::error::SunriseError;
use crate::transport::{HttpRequest, HttpTransport, Method};
use crate::types::*;

pub struct SunriseClient<T: HttpTransport> {
    pub config: SunriseConfig,
    pub transport: T,
}

impl<T: HttpTransport> SunriseClient<T> {
    pub fn new(config: SunriseConfig, transport: T) -> Self {
        Self { config, transport }
    }

    async fn request(
        &self,
        method: Method,
        path: &str,
        body: Option<String>,
        query: Vec<(String, String)>,
    ) -> Result<String, SunriseError> {
        let resp = self
            .transport
            .execute(HttpRequest {
                method,
                url: self.config.url(path),
                headers: self.config.auth_headers(),
                body,
                query,
            })
            .await?;

        if resp.status == 401 {
            return Err(SunriseError::Auth(resp.body));
        }
        if resp.status >= 200 && resp.status < 300 {
            Ok(resp.body)
        } else {
            Err(SunriseError::Http {
                status: resp.status,
                body: resp.body,
            })
        }
    }

    async fn get(&self, path: &str, query: Vec<(String, String)>) -> Result<String, SunriseError> {
        self.request(Method::Get, path, None, query).await
    }

    async fn post(&self, path: &str, body: Option<String>) -> Result<String, SunriseError> {
        self.request(Method::Post, path, body, vec![]).await
    }

    async fn put(&self, path: &str, body: Option<String>) -> Result<String, SunriseError> {
        self.request(Method::Put, path, body, vec![]).await
    }

    async fn delete(
        &self,
        path: &str,
        query: Vec<(String, String)>,
    ) -> Result<String, SunriseError> {
        self.request(Method::Delete, path, None, query).await
    }

    // --- Auth ---

    pub async fn auth_login(&self, email: &str, password: &str) -> Result<LoginResponse, SunriseError> {
        let body = serde_json::to_string(&LoginRequest {
            email: email.to_string(),
            password: password.to_string(),
        })?;
        let resp = self.post("/auth/login", Some(body)).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    pub async fn auth_login_2fa(&self, pending_token: &str, code: &str) -> Result<LoginResponse, SunriseError> {
        let body = serde_json::to_string(&Login2faRequest {
            pending_token: pending_token.to_string(),
            code: code.to_string(),
        })?;
        let resp = self.post("/auth/login/2fa", Some(body)).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    pub async fn auth_logout(&self) -> Result<(), SunriseError> {
        self.post("/auth/logout", None).await?;
        Ok(())
    }

    pub async fn auth_me(&self) -> Result<UserProfile, SunriseError> {
        let resp = self.get("/auth/me", vec![]).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    // --- IAM ---

    pub async fn iam_list_users(&self) -> Result<Vec<User>, SunriseError> {
        let resp = self.get("/api/iam/users", vec![]).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    pub async fn iam_create_user(&self, req: CreateUserRequest) -> Result<User, SunriseError> {
        let body = serde_json::to_string(&req)?;
        let resp = self.post("/api/iam/users", Some(body)).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    pub async fn iam_get_user(&self, id: &str) -> Result<User, SunriseError> {
        let resp = self.get(&format!("/api/iam/users/{}", id), vec![]).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    pub async fn iam_update_user(&self, id: &str, req: UpdateUserRequest) -> Result<User, SunriseError> {
        let body = serde_json::to_string(&req)?;
        let resp = self.put(&format!("/api/iam/users/{}", id), Some(body)).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    pub async fn iam_delete_user(&self, id: &str) -> Result<SuccessResponse, SunriseError> {
        let resp = self.delete(&format!("/api/iam/users/{}", id), vec![]).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    pub async fn iam_audit(&self) -> Result<Vec<AuditEntry>, SunriseError> {
        let resp = self.get("/api/iam/audit", vec![]).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    pub async fn iam_sessions(&self) -> Result<Vec<Session>, SunriseError> {
        let resp = self.get("/api/iam/sessions", vec![]).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    // --- CMS Posts ---

    pub async fn cms_list_posts(&self) -> Result<Vec<CmsPost>, SunriseError> {
        let resp = self.get("/api/cms/admin/posts", vec![]).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    pub async fn cms_create_post(&self, req: CreatePostRequest) -> Result<CmsPost, SunriseError> {
        let body = serde_json::to_string(&req)?;
        let resp = self.post("/api/cms/admin/posts", Some(body)).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    pub async fn cms_update_post(&self, id: &str, req: UpdatePostRequest) -> Result<CmsPost, SunriseError> {
        let body = serde_json::to_string(&req)?;
        let resp = self.put(&format!("/api/cms/admin/posts/{}", id), Some(body)).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    pub async fn cms_delete_post(&self, id: &str) -> Result<SuccessResponse, SunriseError> {
        let resp = self.delete(&format!("/api/cms/admin/posts/{}", id), vec![]).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    // --- CMS Projects ---

    pub async fn cms_list_projects(&self) -> Result<Vec<CmsProject>, SunriseError> {
        let resp = self.get("/api/cms/admin/projects", vec![]).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    pub async fn cms_create_project(&self, req: CreateProjectRequest) -> Result<CmsProject, SunriseError> {
        let body = serde_json::to_string(&req)?;
        let resp = self.post("/api/cms/admin/projects", Some(body)).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    pub async fn cms_delete_project(&self, id: &str) -> Result<SuccessResponse, SunriseError> {
        let resp = self.delete(&format!("/api/cms/admin/projects/{}", id), vec![]).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    // --- Payroll ---

    pub async fn payroll_list_employees(&self) -> Result<Vec<Employee>, SunriseError> {
        let resp = self.get("/api/payroll/employees", vec![]).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    pub async fn payroll_get_employee(&self, id: &str) -> Result<Employee, SunriseError> {
        let resp = self.get(&format!("/api/payroll/employees/{}", id), vec![]).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    pub async fn payroll_create_employee(&self, req: CreateEmployeeRequest) -> Result<Employee, SunriseError> {
        let body = serde_json::to_string(&req)?;
        let resp = self.post("/api/payroll/employees", Some(body)).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    pub async fn payroll_list_paystubs(&self, employee_id: &str) -> Result<Vec<Paystub>, SunriseError> {
        let resp = self.get(&format!("/api/payroll/employees/{}/paystubs", employee_id), vec![]).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    pub async fn payroll_generate_paystubs(&self, employee_id: &str, year: i32) -> Result<serde_json::Value, SunriseError> {
        let body = serde_json::to_string(&GeneratePaystubsRequest { year })?;
        let resp = self.post(&format!("/api/payroll/employees/{}/paystubs/generate", employee_id), Some(body)).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    pub async fn payroll_paystub_pdf(&self, paystub_id: &str) -> Result<PdfUrlResponse, SunriseError> {
        let resp = self.get(&format!("/api/payroll/paystubs/{}/pdf", paystub_id), vec![]).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    // --- Invoices ---

    pub async fn invoices_list(&self) -> Result<Vec<Invoice>, SunriseError> {
        let resp = self.get("/api/invoices/", vec![]).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    pub async fn invoices_get(&self, id: &str) -> Result<Invoice, SunriseError> {
        let resp = self.get(&format!("/api/invoices/{}", id), vec![]).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    pub async fn invoices_create(&self, req: CreateInvoiceRequest) -> Result<serde_json::Value, SunriseError> {
        let body = serde_json::to_string(&req)?;
        let resp = self.post("/api/invoices/", Some(body)).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    pub async fn invoices_update(&self, id: &str, status: &str, notes: Option<&str>) -> Result<Invoice, SunriseError> {
        let mut body = serde_json::json!({"status": status});
        if let Some(n) = notes {
            body["notes"] = serde_json::json!(n);
        }
        let resp = self.put(&format!("/api/invoices/{}", id), Some(body.to_string())).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    pub async fn invoices_pdf(&self, id: &str) -> Result<PdfUrlResponse, SunriseError> {
        let resp = self.get(&format!("/api/invoices/{}/pdf", id), vec![]).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    // --- Campaigns ---

    pub async fn campaigns_list(&self) -> Result<Vec<Campaign>, SunriseError> {
        let resp = self.get("/api/campaigns/", vec![]).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    pub async fn campaigns_get(&self, id: &str) -> Result<Campaign, SunriseError> {
        let resp = self.get(&format!("/api/campaigns/{}", id), vec![]).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    pub async fn campaigns_create(&self, req: CreateCampaignRequest) -> Result<Campaign, SunriseError> {
        let body = serde_json::to_string(&req)?;
        let resp = self.post("/api/campaigns/", Some(body)).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    pub async fn campaigns_populate(&self, id: &str, req: PopulateCampaignRequest) -> Result<serde_json::Value, SunriseError> {
        let body = serde_json::to_string(&req)?;
        let resp = self.post(&format!("/api/campaigns/{}/populate", id), Some(body)).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    pub async fn campaigns_export(&self, id: &str) -> Result<String, SunriseError> {
        self.get(&format!("/api/campaigns/{}/export", id), vec![]).await
    }

    pub async fn campaigns_delete(&self, id: &str) -> Result<SuccessResponse, SunriseError> {
        let resp = self.delete(&format!("/api/campaigns/{}", id), vec![]).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    // --- Parcels ---

    pub async fn parcels_sync(&self) -> Result<serde_json::Value, SunriseError> {
        let resp = self.post("/api/parcels/sync", None).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    pub async fn parcels_stats(&self) -> Result<serde_json::Value, SunriseError> {
        let resp = self.get("/api/parcels/stats", vec![]).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    pub async fn parcels_filter(&self, query: Vec<(String, String)>) -> Result<Vec<ParcelRecord>, SunriseError> {
        let resp = self.get("/api/parcels/filter", query).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    pub async fn parcels_search(&self, q: &str) -> Result<Vec<ParcelRecord>, SunriseError> {
        let resp = self.get("/api/parcels/search", vec![("q".to_string(), q.to_string())]).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    pub async fn parcels_get(&self, number: &str) -> Result<ParcelRecord, SunriseError> {
        let resp = self.get(&format!("/api/parcels/parcel/{}", number), vec![]).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    // --- Trading ---

    pub async fn trading_account(&self) -> Result<Account, SunriseError> {
        let resp = self.get("/api/account", vec![]).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    pub async fn trading_positions(&self) -> Result<Vec<Position>, SunriseError> {
        let resp = self.get("/api/positions", vec![]).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    pub async fn trading_orders(&self) -> Result<Vec<Order>, SunriseError> {
        let resp = self.get("/api/orders", vec![]).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    pub async fn trading_create_order(&self, req: CreateOrderRequest) -> Result<Order, SunriseError> {
        let body = serde_json::to_string(&req)?;
        let resp = self.post("/api/orders", Some(body)).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    pub async fn trading_cancel_order(&self, id: &str) -> Result<(), SunriseError> {
        self.delete(&format!("/api/orders/{}", id), vec![]).await?;
        Ok(())
    }

    // --- API Keys ---

    pub async fn keys_list(&self) -> Result<Vec<ApiKey>, SunriseError> {
        let resp = self.get("/api/keys/", vec![]).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    pub async fn keys_create(&self, req: CreateApiKeyRequest) -> Result<CreateApiKeyResponse, SunriseError> {
        let body = serde_json::to_string(&req)?;
        let resp = self.post("/api/keys/", Some(body)).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    pub async fn keys_revoke(&self, id: &str) -> Result<SuccessResponse, SunriseError> {
        let resp = self.delete(&format!("/api/keys/{}", id), vec![]).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    // --- Market Data ---

    pub async fn market_data_bars(&self, symbol: &str, query: Vec<(String, String)>) -> Result<serde_json::Value, SunriseError> {
        let resp = self.get(&format!("/api/bars/{}", symbol), query).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    pub async fn market_data_snapshot(&self, symbol: &str) -> Result<serde_json::Value, SunriseError> {
        let resp = self.get(&format!("/api/snapshot/{}", symbol), vec![]).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    // --- Market Overview ---

    pub async fn market_tickers(&self, query: Vec<(String, String)>) -> Result<serde_json::Value, SunriseError> {
        let resp = self.get("/api/market/tickers", query).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    pub async fn market_movers(&self) -> Result<serde_json::Value, SunriseError> {
        let resp = self.get("/api/market/movers", vec![]).await?;
        Ok(serde_json::from_str(&resp)?)
    }

    pub async fn market_overview(&self) -> Result<serde_json::Value, SunriseError> {
        let resp = self.get("/api/market/overview", vec![]).await?;
        Ok(serde_json::from_str(&resp)?)
    }
}
