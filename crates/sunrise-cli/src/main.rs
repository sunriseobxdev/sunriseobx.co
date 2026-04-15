use clap::{Parser, Subcommand};
use sunrise_common::client::SunriseClient;
use sunrise_common::config::{SunriseConfig, DEFAULT_BASE_URL};
use sunrise_common::types::*;
use sunrise_sys::ReqwestTransport;
use std::path::PathBuf;

mod media_fs;
mod media_mount;

#[derive(Parser)]
#[command(name = "sunrise-cli")]
#[command(about = "SunriseOBX admin CLI")]
struct Cli {
    /// API base URL
    #[arg(long, env = "SUNRISE_API_URL", default_value = DEFAULT_BASE_URL)]
    api_url: String,

    /// Auth token (or set SUNRISE_TOKEN env var, or login first)
    #[arg(long, env = "SUNRISE_TOKEN")]
    token: Option<String>,

    /// Output as JSON instead of formatted text
    #[arg(long, short)]
    json: bool,

    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Authentication
    Auth {
        #[command(subcommand)]
        cmd: AuthCmd,
    },
    /// Identity & access management
    Iam {
        #[command(subcommand)]
        cmd: IamCmd,
    },
    /// Content management (posts & projects)
    Cms {
        #[command(subcommand)]
        cmd: CmsCmd,
    },
    /// Payroll management
    Payroll {
        #[command(subcommand)]
        cmd: PayrollCmd,
    },
    /// Invoice management
    Invoices {
        #[command(subcommand)]
        cmd: InvoiceCmd,
    },
    /// Campaign management
    Campaigns {
        #[command(subcommand)]
        cmd: CampaignCmd,
    },
    /// Parcel data (Dare County)
    Parcels {
        #[command(subcommand)]
        cmd: ParcelCmd,
    },
    /// Trading operations
    Trading {
        #[command(subcommand)]
        cmd: TradingCmd,
    },
    /// API key management
    Keys {
        #[command(subcommand)]
        cmd: KeysCmd,
    },
    /// Support ticket management
    Support {
        #[command(subcommand)]
        cmd: SupportCmd,
    },
    /// Market data
    Market {
        #[command(subcommand)]
        cmd: MarketCmd,
    },
    /// Media library management
    Media {
        #[command(subcommand)]
        cmd: MediaCmd,
    },
    /// Mount CDN media as a local filesystem via gRPC + FUSE
    MountMedia {
        /// Mount point path (e.g., /mnt/sunriseobx)
        mountpoint: String,
        /// gRPC endpoint (default: https://media.sunriseobx.co:9999)
        #[arg(long, env = "SUNRISE_MEDIA_URL", default_value = "https://media.sunriseobx.co:9999")]
        media_url: String,
    },
}

#[derive(Subcommand)]
enum MediaCmd {
    /// Browse files in a directory
    Browse {
        /// Path to browse (e.g., img/portfolio)
        #[arg(default_value = "")]
        path: String,
    },
    /// Upload a file
    Upload {
        /// Local file path
        file: String,
        /// Destination path in CDN (e.g., img/portfolio/)
        #[arg(long, default_value = "img/uploads/")]
        dest: String,
    },
    /// Delete a file
    Delete {
        /// CDN file path to delete
        path: String,
    },
    /// Get CDN URL for a file
    Url {
        /// File path
        path: String,
    },
}

// --- Support subcommands ---
#[derive(Subcommand)]
enum SupportCmd {
    /// List all support tickets
    List,
    /// Get ticket details with messages
    Get { id: String },
    /// Reply to a ticket
    Reply {
        id: String,
        #[arg(long)]
        body: String,
    },
    /// Close a ticket
    Close { id: String },
    /// Reopen a ticket
    Reopen { id: String },
}

// --- Auth subcommands ---
#[derive(Subcommand)]
enum AuthCmd {
    /// Login with email/password or API key
    Login {
        #[arg(long)]
        email: Option<String>,
        #[arg(long)]
        password: Option<String>,
        /// API key (starts with spk_)
        #[arg(long)]
        api_key: Option<String>,
    },
    /// Show current user profile
    Me,
    /// Logout
    Logout,
}

// --- IAM subcommands ---
#[derive(Subcommand)]
enum IamCmd {
    /// List all users
    Users,
    /// Create a user
    CreateUser {
        #[arg(long)]
        email: String,
        #[arg(long)]
        password: String,
        #[arg(long)]
        name: Option<String>,
        #[arg(long, default_value = "viewer")]
        role: String,
    },
    /// Get a user by ID
    GetUser { id: String },
    /// Update a user
    UpdateUser {
        id: String,
        #[arg(long)]
        role: Option<String>,
        #[arg(long)]
        name: Option<String>,
        #[arg(long)]
        disabled: Option<bool>,
    },
    /// Delete (disable) a user
    DeleteUser { id: String },
    /// View audit log
    Audit,
    /// List active sessions
    Sessions,
}

// --- CMS subcommands ---
#[derive(Subcommand)]
enum CmsCmd {
    /// List all posts
    Posts,
    /// Create a post
    CreatePost {
        #[arg(long)]
        slug: String,
        #[arg(long)]
        title: String,
        #[arg(long)]
        excerpt: Option<String>,
        #[arg(long)]
        image_url: Option<String>,
        #[arg(long, default_value = "draft")]
        status: String,
    },
    /// Update a post
    UpdatePost {
        id: String,
        #[arg(long)]
        title: Option<String>,
        #[arg(long)]
        slug: Option<String>,
        #[arg(long)]
        status: Option<String>,
    },
    /// Delete a post
    DeletePost { id: String },
    /// List all projects
    Projects,
    /// Delete a project
    DeleteProject { id: String },
}

// --- Payroll subcommands ---
#[derive(Subcommand)]
enum PayrollCmd {
    /// List employees
    Employees,
    /// Get employee details
    GetEmployee { id: String },
    /// Create employee
    CreateEmployee {
        #[arg(long)]
        employee_id: String,
        #[arg(long)]
        name: String,
        #[arg(long)]
        salary: f64,
        #[arg(long)]
        start_date: String,
        #[arg(long)]
        email: Option<String>,
        #[arg(long)]
        department: Option<String>,
        #[arg(long)]
        title: Option<String>,
    },
    /// List paystubs for an employee
    Paystubs { employee_id: String },
    /// Generate paystubs for an employee for a year
    Generate {
        employee_id: String,
        #[arg(long)]
        year: i32,
    },
    /// Get paystub PDF URL
    Pdf { paystub_id: String },
}

// --- Invoice subcommands ---
#[derive(Subcommand)]
enum InvoiceCmd {
    /// List invoices
    List,
    /// Get invoice details
    Get { id: String },
    /// Create invoice
    Create {
        #[arg(long)]
        number: String,
        #[arg(long)]
        client: String,
        #[arg(long)]
        client_email: Option<String>,
        #[arg(long)]
        client_address: Option<String>,
        #[arg(long)]
        issue_date: String,
        #[arg(long)]
        due_date: String,
        /// Line items as JSON: [{"description":"Siding","quantity":1,"rate":25000}]
        #[arg(long)]
        items: String,
        #[arg(long, default_value = "0")]
        tax_rate: f64,
        #[arg(long)]
        notes: Option<String>,
        #[arg(long, default_value = "draft")]
        status: String,
    },
    /// Update invoice status
    Update {
        id: String,
        #[arg(long)]
        status: String,
        #[arg(long)]
        notes: Option<String>,
    },
    /// Get invoice PDF URL
    Pdf { id: String },
}

// --- Campaign subcommands ---
#[derive(Subcommand)]
enum CampaignCmd {
    /// List campaigns
    List,
    /// Get campaign details
    Get { id: String },
    /// Create campaign
    Create {
        #[arg(long)]
        name: String,
        #[arg(long)]
        subject: Option<String>,
    },
    /// Populate campaign recipients from parcels
    Populate {
        id: String,
        #[arg(long)]
        town: Option<String>,
        #[arg(long)]
        out_of_state: Option<bool>,
        #[arg(long)]
        min_value: Option<f64>,
    },
    /// Export campaign recipients as CSV
    Export { id: String },
    /// Delete campaign
    Delete { id: String },
}

// --- Parcel subcommands ---
#[derive(Subcommand)]
enum ParcelCmd {
    /// Sync parcels from GeoServer
    Sync,
    /// Get parcel statistics
    Stats,
    /// Search parcels
    Search { query: String },
    /// Get a single parcel
    Get { number: String },
    /// Filter parcels
    Filter {
        #[arg(long)]
        town: Option<String>,
        #[arg(long)]
        min_value: Option<String>,
        #[arg(long)]
        max_value: Option<String>,
        #[arg(long)]
        owner: Option<String>,
    },
}

// --- Trading subcommands ---
#[derive(Subcommand)]
enum TradingCmd {
    /// Show account info
    Account,
    /// List positions
    Positions,
    /// List orders
    Orders,
    /// Cancel an order
    CancelOrder { id: String },
}

// --- API Keys subcommands ---
#[derive(Subcommand)]
enum KeysCmd {
    /// List API keys
    List,
    /// Create API key
    Create {
        #[arg(long)]
        name: String,
    },
    /// Revoke API key
    Revoke { id: String },
}

// --- Market subcommands ---
#[derive(Subcommand)]
enum MarketCmd {
    /// Market overview
    Overview,
    /// Top movers
    Movers,
    /// Get snapshot for a symbol
    Snapshot { symbol: String },
    /// Get bars for a symbol
    Bars {
        symbol: String,
        #[arg(long, default_value = "1Day")]
        timeframe: String,
        #[arg(long)]
        start: Option<String>,
        #[arg(long)]
        end: Option<String>,
    },
}

fn token_path() -> PathBuf {
    dirs_next().join(".sunrise-token")
}

fn dirs_next() -> PathBuf {
    std::env::var("HOME")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("."))
}

fn load_token() -> Option<String> {
    std::fs::read_to_string(token_path()).ok().map(|s| s.trim().to_string()).filter(|s| !s.is_empty())
}

fn save_token(token: &str) {
    let _ = std::fs::write(token_path(), token);
}

fn clear_token() {
    let _ = std::fs::remove_file(token_path());
}

fn print_json<T: serde::Serialize>(val: &T) {
    println!("{}", serde_json::to_string_pretty(val).unwrap_or_default());
}

#[tokio::main]
async fn main() {
    env_logger::init();
    let cli = Cli::parse();

    let token = cli.token.clone().or_else(load_token);
    let config = SunriseConfig::new(&cli.api_url, token);
    let client = SunriseClient::new(config, ReqwestTransport::new());

    let result = run(&cli, &client).await;
    if let Err(e) = result {
        eprintln!("Error: {}", e);
        std::process::exit(1);
    }
}

async fn run(cli: &Cli, client: &SunriseClient<ReqwestTransport>) -> Result<(), sunrise_common::error::SunriseError> {
    match &cli.command {
        Commands::Auth { cmd } => match cmd {
            AuthCmd::Login { email, password, api_key } => {
                // API key auth — just save it directly
                if let Some(key) = api_key {
                    save_token(key);
                    println!("API key saved. Run: sunrise-cli auth me");
                } else {
                    // Interactive prompts if args not provided
                    let email = match email {
                        Some(e) => e.clone(),
                        None => {
                            eprint!("Email (or paste API key): ");
                            let mut input = String::new();
                            std::io::stdin().read_line(&mut input).unwrap();
                            let input = input.trim().to_string();
                            if input.starts_with("spk_") {
                                save_token(&input);
                                println!("API key saved. Run: sunrise-cli auth me");
                                return Ok(());
                            }
                            input
                        }
                    };
                    let password = match password {
                        Some(p) => p.clone(),
                        None => {
                            eprint!("Password: ");
                            let mut input = String::new();
                            std::io::stdin().read_line(&mut input).unwrap();
                            input.trim().to_string()
                        }
                    };
                    let resp = client.auth_login(&email, &password).await?;
                    if resp.pending_2fa == Some(true) {
                        println!("2FA required. Use pending token to complete login.");
                        if let Some(pt) = &resp.pending_token {
                            println!("Pending token: {}", pt);
                        }
                    } else if let Some(token) = &resp.token {
                        save_token(token);
                        println!("Login successful. Token saved to {:?}", token_path());
                    }
                }
            }
            AuthCmd::Me => {
                let user = client.auth_me().await?;
                if cli.json {
                    print_json(&user);
                } else {
                    println!("Email: {}", user.email);
                    println!("Name:  {}", user.display_name.as_deref().unwrap_or("-"));
                    println!("Role:  {}", user.role);
                    println!("2FA:   {}", if user.totp_enabled == Some(true) { "enabled" } else { "disabled" });
                }
            }
            AuthCmd::Logout => {
                client.auth_logout().await?;
                clear_token();
                println!("Logged out.");
            }
        },

        Commands::Iam { cmd } => match cmd {
            IamCmd::Users => {
                let users = client.iam_list_users().await?;
                if cli.json {
                    print_json(&users);
                } else {
                    println!("{:<36}  {:<30}  {:<12}  {}", "ID", "EMAIL", "ROLE", "STATUS");
                    for u in &users {
                        let status = if u.disabled == Some(true) { "disabled" } else { "active" };
                        println!("{:<36}  {:<30}  {:<12}  {}", u.id, u.email, u.role, status);
                    }
                }
            }
            IamCmd::CreateUser { email, password, name, role } => {
                let user = client.iam_create_user(CreateUserRequest {
                    email: email.clone(),
                    password: password.clone(),
                    display_name: name.clone(),
                    role: Some(role.clone()),
                    privileges: None,
                }).await?;
                println!("Created user: {} ({})", user.email, user.id);
            }
            IamCmd::GetUser { id } => {
                let user = client.iam_get_user(id).await?;
                print_json(&user);
            }
            IamCmd::UpdateUser { id, role, name, disabled } => {
                let user = client.iam_update_user(id, UpdateUserRequest {
                    role: role.clone(),
                    display_name: name.clone(),
                    disabled: *disabled,
                    privileges: None,
                }).await?;
                println!("Updated user: {} ({})", user.email, user.role);
            }
            IamCmd::DeleteUser { id } => {
                client.iam_delete_user(id).await?;
                println!("User disabled.");
            }
            IamCmd::Audit => {
                let entries = client.iam_audit().await?;
                if cli.json {
                    print_json(&entries);
                } else {
                    for e in &entries {
                        println!("[{}] {} {} {}", e.created_at, e.action, e.resource.as_deref().unwrap_or(""), e.ip_address.as_deref().unwrap_or(""));
                    }
                }
            }
            IamCmd::Sessions => {
                let sessions = client.iam_sessions().await?;
                print_json(&sessions);
            }
        },

        Commands::Cms { cmd } => match cmd {
            CmsCmd::Posts => {
                let posts = client.cms_list_posts().await?;
                if cli.json {
                    print_json(&posts);
                } else {
                    println!("{:<36}  {:<20}  {:<10}  {}", "ID", "SLUG", "STATUS", "TITLE");
                    for p in &posts {
                        println!("{:<36}  {:<20}  {:<10}  {}", p.id, p.slug, p.status, p.title);
                    }
                }
            }
            CmsCmd::CreatePost { slug, title, excerpt, image_url, status } => {
                let post = client.cms_create_post(CreatePostRequest {
                    slug: slug.clone(),
                    title: title.clone(),
                    excerpt: excerpt.clone(),
                    content: None,
                    image_url: image_url.clone(),
                    status: Some(status.clone()),
                }).await?;
                println!("Created post: {} ({})", post.slug, post.id);
            }
            CmsCmd::UpdatePost { id, title, slug, status } => {
                let post = client.cms_update_post(id, UpdatePostRequest {
                    title: title.clone(),
                    slug: slug.clone(),
                    status: status.clone(),
                    excerpt: None,
                    content: None,
                    image_url: None,
                }).await?;
                println!("Updated post: {} ({})", post.slug, post.status);
            }
            CmsCmd::DeletePost { id } => {
                client.cms_delete_post(id).await?;
                println!("Post deleted.");
            }
            CmsCmd::Projects => {
                let projects = client.cms_list_projects().await?;
                print_json(&projects);
            }
            CmsCmd::DeleteProject { id } => {
                client.cms_delete_project(id).await?;
                println!("Project deleted.");
            }
        },

        Commands::Payroll { cmd } => match cmd {
            PayrollCmd::Employees => {
                let employees = client.payroll_list_employees().await?;
                if cli.json {
                    print_json(&employees);
                } else {
                    println!("{:<36}  {:<10}  {:<30}  {}", "ID", "EMP_ID", "NAME", "DEPARTMENT");
                    for e in &employees {
                        println!("{:<36}  {:<10}  {:<30}  {}", e.id, e.employee_id, e.full_name, e.department.as_deref().unwrap_or("-"));
                    }
                }
            }
            PayrollCmd::GetEmployee { id } => {
                let emp = client.payroll_get_employee(id).await?;
                print_json(&emp);
            }
            PayrollCmd::CreateEmployee { employee_id, name, salary, start_date, email, department, title } => {
                let emp = client.payroll_create_employee(CreateEmployeeRequest {
                    employee_id: employee_id.clone(),
                    full_name: name.clone(),
                    email: email.clone(),
                    annual_salary: *salary,
                    pay_frequency: Some("biweekly".to_string()),
                    filing_status: Some("single".to_string()),
                    start_date: start_date.clone(),
                    department: department.clone(),
                    title: title.clone(),
                }).await?;
                println!("Created employee: {} ({})", emp.full_name, emp.id);
            }
            PayrollCmd::Paystubs { employee_id } => {
                let stubs = client.payroll_list_paystubs(employee_id).await?;
                if cli.json {
                    print_json(&stubs);
                } else {
                    println!("{:<36}  {:<4}  {:<12}  {:>10}  {:>10}", "ID", "#", "PAY_DATE", "GROSS", "NET");
                    for s in &stubs {
                        println!("{:<36}  {:<4}  {:<12}  {:>10.2}  {:>10.2}",
                            s.id, s.stub_number, s.pay_date,
                            s.gross_pay.unwrap_or(0.0), s.net_pay.unwrap_or(0.0));
                    }
                }
            }
            PayrollCmd::Generate { employee_id, year } => {
                let result = client.payroll_generate_paystubs(employee_id, *year).await?;
                print_json(&result);
            }
            PayrollCmd::Pdf { paystub_id } => {
                let resp = client.payroll_paystub_pdf(paystub_id).await?;
                println!("{}", resp.url);
            }
        },

        Commands::Invoices { cmd } => match cmd {
            InvoiceCmd::List => {
                let invoices = client.invoices_list().await?;
                if cli.json {
                    print_json(&invoices);
                } else {
                    println!("{:<36}  {:<12}  {:<25}  {:>10}  {}", "ID", "NUMBER", "CLIENT", "TOTAL", "STATUS");
                    for i in &invoices {
                        let total_str = i.total.as_ref().map(|v| v.to_string()).unwrap_or_else(|| "0".to_string());
                    println!("{:<36}  {:<12}  {:<25}  {:>10}  {}",
                            i.id, i.invoice_number, i.client_name, total_str, i.status);
                    }
                }
            }
            InvoiceCmd::Get { id } => {
                let inv = client.invoices_get(id).await?;
                print_json(&inv);
            }
            InvoiceCmd::Create { number, client: client_name, client_email, client_address, issue_date, due_date, items, tax_rate, notes, status } => {
                let line_items: serde_json::Value = serde_json::from_str(items).unwrap_or_else(|e| {
                    eprintln!("Invalid JSON for --items: {}", e);
                    std::process::exit(1);
                });
                let inv = client.invoices_create(CreateInvoiceRequest {
                    invoice_number: number.clone(),
                    client_name: client_name.clone(),
                    client_email: client_email.clone(),
                    client_address: client_address.clone(),
                    issue_date: issue_date.clone(),
                    due_date: due_date.clone(),
                    line_items,
                    tax_rate: if *tax_rate > 0.0 { Some(*tax_rate) } else { None },
                    notes: notes.clone(),
                    status: Some(status.clone()),
                }).await?;
                println!("Invoice created: {}", number);
                print_json(&inv);
            }
            InvoiceCmd::Update { id, status, notes } => {
                let inv = client.invoices_update(id, status, notes.as_deref()).await?;
                println!("Invoice updated: {} → {}", inv.invoice_number, inv.status);
            }
            InvoiceCmd::Pdf { id } => {
                let resp = client.invoices_pdf(id).await?;
                println!("{}", resp.url);
            }
        },

        Commands::Campaigns { cmd } => match cmd {
            CampaignCmd::List => {
                let campaigns = client.campaigns_list().await?;
                if cli.json {
                    print_json(&campaigns);
                } else {
                    println!("{:<36}  {:<30}  {:<10}  {:>8}", "ID", "NAME", "STATUS", "RECIPIENTS");
                    for c in &campaigns {
                        println!("{:<36}  {:<30}  {:<10}  {:>8}",
                            c.id, c.name, c.status, c.total_recipients.unwrap_or(0));
                    }
                }
            }
            CampaignCmd::Get { id } => {
                let c = client.campaigns_get(id).await?;
                print_json(&c);
            }
            CampaignCmd::Create { name, subject } => {
                let c = client.campaigns_create(CreateCampaignRequest {
                    name: name.clone(),
                    subject: subject.clone(),
                    body_html: None,
                    filter_type: None,
                    filter_value: None,
                }).await?;
                println!("Created campaign: {} ({})", c.name, c.id);
            }
            CampaignCmd::Populate { id, town, out_of_state, min_value } => {
                let result = client.campaigns_populate(id, PopulateCampaignRequest {
                    filter_type: None,
                    filter_value: None,
                    min_value: *min_value,
                    max_value: None,
                    town: town.clone(),
                    out_of_state: *out_of_state,
                }).await?;
                print_json(&result);
            }
            CampaignCmd::Export { id } => {
                let csv = client.campaigns_export(id).await?;
                print!("{}", csv);
            }
            CampaignCmd::Delete { id } => {
                client.campaigns_delete(id).await?;
                println!("Campaign deleted.");
            }
        },

        Commands::Parcels { cmd } => match cmd {
            ParcelCmd::Sync => {
                println!("Syncing parcels from GeoServer...");
                let result = client.parcels_sync().await?;
                print_json(&result);
            }
            ParcelCmd::Stats => {
                let stats = client.parcels_stats().await?;
                print_json(&stats);
            }
            ParcelCmd::Search { query } => {
                let parcels = client.parcels_search(query).await?;
                if cli.json {
                    print_json(&parcels);
                } else {
                    println!("{:<12}  {:<30}  {:<20}  {:>12}", "PARCEL", "OWNER", "TOWN", "VALUE");
                    for p in &parcels {
                        println!("{:<12}  {:<30}  {:<20}  {:>12.0}",
                            p.parcel,
                            p.owner1.as_deref().unwrap_or("-"),
                            p.zipname.as_deref().unwrap_or("-"),
                            p.totval.unwrap_or(0.0));
                    }
                }
            }
            ParcelCmd::Get { number } => {
                let p = client.parcels_get(number).await?;
                print_json(&p);
            }
            ParcelCmd::Filter { town, min_value, max_value, owner } => {
                let mut query = vec![];
                if let Some(t) = town { query.push(("town".to_string(), t.clone())); }
                if let Some(v) = min_value { query.push(("minValue".to_string(), v.clone())); }
                if let Some(v) = max_value { query.push(("maxValue".to_string(), v.clone())); }
                if let Some(o) = owner { query.push(("owner".to_string(), o.clone())); }
                let parcels = client.parcels_filter(query).await?;
                if cli.json {
                    print_json(&parcels);
                } else {
                    println!("{} parcels found", parcels.len());
                    for p in parcels.iter().take(20) {
                        println!("  {} — {} — {:>10.0}",
                            p.parcel, p.owner1.as_deref().unwrap_or("-"), p.totval.unwrap_or(0.0));
                    }
                    if parcels.len() > 20 {
                        println!("  ... and {} more (use --json for full output)", parcels.len() - 20);
                    }
                }
            }
        },

        Commands::Trading { cmd } => match cmd {
            TradingCmd::Account => {
                let acct = client.trading_account().await?;
                if cli.json {
                    print_json(&acct);
                } else {
                    println!("Equity:          {}", acct.equity.as_deref().unwrap_or("-"));
                    println!("Cash:            {}", acct.cash.as_deref().unwrap_or("-"));
                    println!("Buying Power:    {}", acct.buying_power.as_deref().unwrap_or("-"));
                    println!("Portfolio Value: {}", acct.portfolio_value.as_deref().unwrap_or("-"));
                }
            }
            TradingCmd::Positions => {
                let positions = client.trading_positions().await?;
                if cli.json {
                    print_json(&positions);
                } else {
                    println!("{:<8}  {:>8}  {:>10}  {:>12}  {:>10}", "SYMBOL", "QTY", "PRICE", "MKT_VALUE", "P/L");
                    for p in &positions {
                        println!("{:<8}  {:>8}  {:>10}  {:>12}  {:>10}",
                            p.symbol,
                            p.qty.as_deref().unwrap_or("-"),
                            p.current_price.as_deref().unwrap_or("-"),
                            p.market_value.as_deref().unwrap_or("-"),
                            p.unrealized_pl.as_deref().unwrap_or("-"));
                    }
                }
            }
            TradingCmd::Orders => {
                let orders = client.trading_orders().await?;
                print_json(&orders);
            }
            TradingCmd::CancelOrder { id } => {
                client.trading_cancel_order(id).await?;
                println!("Order cancelled.");
            }
        },

        Commands::Keys { cmd } => match cmd {
            KeysCmd::List => {
                let keys = client.keys_list().await?;
                if cli.json {
                    print_json(&keys);
                } else {
                    println!("{:<36}  {:<20}  {:<12}  {}", "ID", "NAME", "PREFIX", "LAST_USED");
                    for k in &keys {
                        println!("{:<36}  {:<20}  {:<12}  {}",
                            k.id, k.name, k.key_prefix, k.last_used.as_deref().unwrap_or("never"));
                    }
                }
            }
            KeysCmd::Create { name } => {
                let resp = client.keys_create(CreateApiKeyRequest {
                    name: name.clone(),
                    expires_at: None,
                }).await?;
                println!("API Key: {}", resp.key);
                println!("(save this — it won't be shown again)");
            }
            KeysCmd::Revoke { id } => {
                client.keys_revoke(id).await?;
                println!("API key revoked.");
            }
        },

        Commands::Support { cmd } => match cmd {
            SupportCmd::List => {
                let tickets = client.support_list_tickets().await?;
                if cli.json {
                    print_json(&tickets);
                } else {
                    let empty = vec![];
                    let arr = tickets.as_array().unwrap_or(&empty);
                    println!("{:<36}  {:<10}  {:<12}  {:<10}  {}", "ID", "TICKET #", "STATUS", "PRIORITY", "SUBJECT");
                    for t in arr {
                        println!("{:<36}  {:<10}  {:<12}  {:<10}  {}",
                            t["id"].as_str().unwrap_or("-"),
                            t["ticket_number"].as_str().unwrap_or("-"),
                            t["status"].as_str().unwrap_or("-"),
                            t["priority"].as_str().unwrap_or("-"),
                            t["subject"].as_str().unwrap_or("-"));
                    }
                }
            }
            SupportCmd::Get { id } => {
                let ticket = client.support_get_ticket(id).await?;
                print_json(&ticket);
            }
            SupportCmd::Reply { id, body } => {
                client.support_reply(id, body).await?;
                println!("Reply sent.");
            }
            SupportCmd::Close { id } => {
                client.support_update_ticket(id, "closed").await?;
                println!("Ticket closed.");
            }
            SupportCmd::Reopen { id } => {
                client.support_update_ticket(id, "open").await?;
                println!("Ticket reopened.");
            }
        },

        Commands::Market { cmd } => match cmd {
            MarketCmd::Overview => {
                let data = client.market_overview().await?;
                print_json(&data);
            }
            MarketCmd::Movers => {
                let data = client.market_movers().await?;
                print_json(&data);
            }
            MarketCmd::Snapshot { symbol } => {
                let data = client.market_data_snapshot(symbol).await?;
                print_json(&data);
            }
            MarketCmd::Bars { symbol, timeframe, start, end } => {
                let mut query = vec![("timeframe".to_string(), timeframe.clone())];
                if let Some(s) = start { query.push(("start".to_string(), s.clone())); }
                if let Some(e) = end { query.push(("end".to_string(), e.clone())); }
                let data = client.market_data_bars(symbol, query).await?;
                print_json(&data);
            }
        },
        Commands::Media { cmd } => match cmd {
            MediaCmd::Browse { path } => {
                let resp: MediaBrowseResponse = client.get_json("/api/media/browse", vec![("path".to_string(), path.clone())]).await?;
                if cli.json {
                    print_json(&resp);
                } else {
                    println!("/{}", resp.prefix);
                    for e in &resp.entries {
                        let icon = if e.entry_type == "dir" { "📁" } else { "📄" };
                        let size = e.size.map(|s| format!("  {}KB", s / 1024)).unwrap_or_default();
                        println!("  {} {}{}", icon, e.name, size);
                    }
                }
            }
            MediaCmd::Upload { file, dest } => {
                let file_path = std::path::Path::new(file);
                let file_name = file_path.file_name().unwrap_or_default().to_string_lossy();
                let data = std::fs::read(file_path).map_err(|e| sunrise_common::error::SunriseError::Other(format!("Failed to read file: {}", e)))?;

                let client = reqwest::Client::new();
                let token = cli.token.clone().or_else(load_token).unwrap_or_default();
                let form = reqwest::multipart::Form::new()
                    .text("path", dest.clone())
                    .part("files", reqwest::multipart::Part::bytes(data).file_name(file_name.to_string()));

                let resp = client.post(format!("{}/api/media/upload", cli.api_url))
                    .header("Authorization", format!("Bearer {}", token))
                    .multipart(form)
                    .send()
                    .await
                    .map_err(|e| sunrise_common::error::SunriseError::Transport(e.to_string()))?;

                let body: serde_json::Value = resp.json().await
                    .map_err(|e| sunrise_common::error::SunriseError::Deserialize(e.to_string()))?;
                println!("{}", serde_json::to_string_pretty(&body).unwrap_or_default());
            }
            MediaCmd::Delete { path } => {
                let _: serde_json::Value = client.delete_json(&format!("/api/media/file?path={}", urlencoding(path))).await?;
                println!("Deleted: {}", path);
            }
            MediaCmd::Url { path } => {
                println!("https://cdn.sunriseobx.co/{}", path);
            }
        },
        Commands::MountMedia { mountpoint, media_url } => {
            let token = cli.token.clone().or_else(load_token)
                .ok_or_else(|| sunrise_common::error::SunriseError::Auth("Not logged in. Run: sunrise-cli auth login".to_string()))?;
            match media_mount::mount(media_url, &token, mountpoint).await {
                Ok(()) => {}
                Err(e) => eprintln!("Error: {}", e),
            }
        },
    }
    Ok(())
}

fn urlencoding(s: &str) -> String {
    s.bytes().map(|b| match b {
        b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'/' => (b as char).to_string(),
        _ => format!("%{:02X}", b),
    }).collect()
}
