import { getPool } from "./db.js";

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  role VARCHAR(20) NOT NULL DEFAULT 'viewer',
  privileges JSONB DEFAULT '[]'::jsonb,
  disabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  created_by UUID REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  resource VARCHAR(100),
  details JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chart_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol VARCHAR(10) NOT NULL,
  name VARCHAR(100),
  drawings JSONB DEFAULT '[]'::jsonb,
  indicators JSONB DEFAULT '[]'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_chart_layouts_user_id ON chart_layouts(user_id);
`;

const TOTP_MIGRATION_SQL = `
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_verified_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS totp_recovery_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash VARCHAR(64) NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_totp_recovery_user ON totp_recovery_codes(user_id);
`;

const PAYROLL_MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  email VARCHAR(255),
  street_address_1 VARCHAR(200),
  street_address_2 VARCHAR(200),
  city_state_zip VARCHAR(200),
  last_four_ssn VARCHAR(4),
  bank_routing VARCHAR(9),
  bank_account_last_four VARCHAR(4),
  annual_salary NUMERIC(12,2) NOT NULL,
  pay_frequency VARCHAR(20) DEFAULT 'biweekly',
  filing_status VARCHAR(20) DEFAULT 'single',
  exemptions INT DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE,
  department VARCHAR(100),
  title VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS paystubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  stub_number INT NOT NULL,
  pay_date DATE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  gross_pay NUMERIC(12,2) NOT NULL,
  hours NUMERIC(6,2) DEFAULT 86.67,
  medicare_tax NUMERIC(10,2) NOT NULL,
  ss_tax NUMERIC(10,2) NOT NULL,
  federal_tax NUMERIC(10,2) NOT NULL,
  state_tax NUMERIC(10,2) DEFAULT 0,
  total_deductions NUMERIC(10,2) NOT NULL,
  net_pay NUMERIC(12,2) NOT NULL,
  gross_ytd NUMERIC(12,2) NOT NULL,
  medicare_ytd NUMERIC(10,2) NOT NULL,
  ss_ytd NUMERIC(10,2) NOT NULL,
  federal_ytd NUMERIC(10,2) NOT NULL,
  net_ytd NUMERIC(12,2) NOT NULL,
  pdf_path VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  client_name VARCHAR(200) NOT NULL,
  client_email VARCHAR(255),
  client_address TEXT,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(12,2) NOT NULL,
  tax_rate NUMERIC(5,4) DEFAULT 0,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) NOT NULL,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'draft',
  pdf_path VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_paystubs_employee_id ON paystubs(employee_id);
CREATE INDEX IF NOT EXISTS idx_paystubs_pay_date ON paystubs(pay_date);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
`;

const API_KEYS_MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  key_hash VARCHAR(64) NOT NULL,
  key_prefix VARCHAR(12) NOT NULL,
  last_used TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  revoked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
`;

const CMS_MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS cms_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  excerpt TEXT,
  content JSONB DEFAULT '{}'::jsonb,
  image_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'draft',
  author_id UUID REFERENCES users(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cms_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  services TEXT,
  location VARCHAR(255),
  status VARCHAR(20) DEFAULT 'draft',
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cms_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  content JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(20) DEFAULT 'published',
  author_id UUID REFERENCES users(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cms_posts_slug ON cms_posts(slug);
CREATE INDEX IF NOT EXISTS idx_cms_posts_status ON cms_posts(status);
CREATE INDEX IF NOT EXISTS idx_cms_projects_slug ON cms_projects(slug);
CREATE INDEX IF NOT EXISTS idx_cms_projects_featured ON cms_projects(featured);
CREATE INDEX IF NOT EXISTS idx_cms_pages_slug ON cms_pages(slug);
`;

const CAMPAIGNS_MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  body_html TEXT,
  status VARCHAR(20) DEFAULT 'draft',
  filter_type VARCHAR(50),
  filter_value TEXT,
  created_by UUID REFERENCES users(id),
  sent_at TIMESTAMPTZ,
  total_recipients INT DEFAULT 0,
  total_sent INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  owner_name VARCHAR(255),
  mail_address VARCHAR(500),
  mail_city VARCHAR(100),
  mail_state VARCHAR(10),
  mail_zip VARCHAR(20),
  parcel VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_status ON campaign_recipients(status);
`;

const PARCELS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS parcels (
  id SERIAL PRIMARY KEY,
  parcel VARCHAR(20) UNIQUE NOT NULL,
  pin VARCHAR(20),
  owner1 VARCHAR(255),
  owner2 VARCHAR(255),
  mailaddr1 VARCHAR(255),
  mailaddr2 VARCHAR(255),
  mailcity VARCHAR(100),
  mailstate VARCHAR(10),
  mailzip VARCHAR(20),
  stnum VARCHAR(20),
  stdir VARCHAR(10),
  stname VARCHAR(100),
  stsuffix VARCHAR(20),
  stapt VARCHAR(20),
  zipname VARCHAR(100),
  zip VARCHAR(10),
  subdivision VARCHAR(255),
  lotblksec VARCHAR(255),
  landval NUMERIC(12,2) DEFAULT 0,
  bldgval NUMERIC(12,2) DEFAULT 0,
  totval NUMERIC(12,2) DEFAULT 0,
  calcacre NUMERIC(10,4),
  puse VARCHAR(100),
  buildtype VARCHAR(100),
  yearbt VARCHAR(10),
  taxdistname VARCHAR(100),
  zoning VARCHAR(20),
  ownership VARCHAR(10),
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parcels_zipname ON parcels(zipname);
CREATE INDEX IF NOT EXISTS idx_parcels_totval ON parcels(totval);
CREATE INDEX IF NOT EXISTS idx_parcels_mailstate ON parcels(mailstate);
CREATE INDEX IF NOT EXISTS idx_parcels_owner1 ON parcels(owner1);
CREATE INDEX IF NOT EXISTS idx_parcels_subdivision ON parcels(subdivision);
`;

export async function runMigrations(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.log(
      "DATABASE_URL not set — skipping migrations, using env-var auth fallback"
    );
    return;
  }

  const pool = getPool();

  console.log("Running database migrations...");
  await pool.query(SCHEMA_SQL);
  await pool.query(TOTP_MIGRATION_SQL);
  await pool.query(PAYROLL_MIGRATION_SQL);
  await pool.query(API_KEYS_MIGRATION_SQL);
  await pool.query(CMS_MIGRATION_SQL);
  await pool.query(CAMPAIGNS_MIGRATION_SQL);
  await pool.query(PARCELS_TABLE_SQL);
  console.log("Schema migration complete.");

  // Seed superadmin if not exists
  const adminEmail = process.env.ADMIN_EMAIL || "admin@sunriseobx.co";
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminPasswordHash) {
    console.log(
      "ADMIN_PASSWORD_HASH not set — skipping superadmin seed"
    );
    return;
  }

  const existing = await pool.query(
    "SELECT id FROM users WHERE email = $1",
    [adminEmail]
  );

  if (existing.rows.length === 0) {
    await pool.query(
      `INSERT INTO users (email, password_hash, display_name, role, privileges)
       VALUES ($1, $2, 'Super Admin', 'superadmin', '[]'::jsonb)`,
      [adminEmail, adminPasswordHash]
    );
    console.log(`Seeded superadmin user: ${adminEmail}`);
  } else {
    console.log(`Superadmin user already exists: ${adminEmail}`);
  }
}
