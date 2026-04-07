import pg from "pg";
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

const SEED_BLOG_POSTS = [
  {
    slug: "coolcoastal",
    title: "Cool Coastal House Package",
    excerpt: "Built for Comfort, Efficiency, and Style",
    image_url: "/img/solarDefense.jpg",
    published_at: "2024-09-04",
    content: {
      markdown: "The unique coastal environment presents specific challenges for homeowners. Whether it's the salty air, intense sun, or high winds, the coastal climate requires durable, energy-efficient materials. Sunrise Construction's *Cool Coastal House Package* meets these demands with two standout products: Low-E House Wrap and SolarDefense Siding. These elements work in harmony to create homes that are resilient, energy-efficient, and visually striking.\n\n### Low-E House Wrap: Optimized Energy Efficiency\nOne of the key products in the Cool Coastal House Package is Low-E House Wrap. This innovative material offers significant energy savings by reflecting up to 97% of radiant heat. By creating a thermal break and adding R-value to the wall system, it helps regulate indoor temperatures, reducing the need for excessive heating or cooling. This means more comfort year-round and lower energy bills.\n\nThe Low-E House Wrap not only enhances thermal performance but also stops thermal bridging through sidewall studs, preventing energy loss. It adds sound attenuation comparable to 3 inches of fiberglass, contributing to a quieter, more peaceful living space. Installation is seamless and straightforward, with full five-square coverage thanks to a built-in overlap. Compatible with most exterior cladding, this versatile product is trusted by builders and remodelers nationwide.\n\n### SolarDefense Siding: Style Meets Durability\nSunrise Construction pairs energy efficiency with unbeatable style using SolarDefense siding. This cutting-edge siding technology is designed to protect homes from the harsh sun while offering gorgeous, bold colors that won't fade. SolarDefense Reflective Technology effectively prevents heat absorption and distortion, ensuring that your home maintains its appearance even under the strongest coastal sun.\n\nIn addition to heat protection, SolarDefense siding resists UV damage with its tough, UV-stable polymer. This durable material is molecularly bonded to ensure long-lasting performance. Homeowners can enjoy the beauty of dark, rich siding without the worry of fading, peeling, or cracking. The easy maintenance\u2014just soap and water\u2014is another key advantage, offering a hassle-free solution to exterior care.\n\n### Expert Installation: A Key Differentiator\nWhat truly separates Sunrise Construction from other builders is their commitment to superior installation practices, designed specifically for the coastal environment. All siding is installed with stainless steel fasteners, which are corrosion-resistant and won't deteriorate over time, ensuring the longevity of the exterior.\n\nIn addition, Sunrise Construction uses Huber Zip flashing tape to seal not only the laps in the Low-E House Wrap but also all siding accessories, including J-channels, light boxes, and corners. This added attention to detail provides an extra layer of protection, preventing moisture intrusion and ensuring a complete, durable installation.\n\n### Coastal Resilience and Comfort\nSunrise Construction's Cool Coastal House Package combines the power of Low-E House Wrap and SolarDefense siding to create a home that is not only energy-efficient but also resilient against the harsh elements of the coast. The package offers top-tier thermal insulation, energy savings, and lasting beauty\u2014all essential for homeowners in coastal environments.\n\nWith a commitment to quality craftsmanship and durable materials, Sunrise Construction continues to deliver homes built to withstand the test of time, while providing modern comfort and style.",
      categories: ["Construction", "Outer Banks", "Siding", "Insulation"],
      author: { name: "Zachary Wayland", avatar: "/img/hardhat.jpeg" },
      gallery: { enabled: false, items: [] as { image: string; alt: string }[], cols: 3 },
      additional: { enabled: false, content: "" },
    },
  },
  {
    slug: "saltbox",
    title: "The Salt Box Package",
    excerpt: "The Salt Box system is our base-tier offering, designed specifically for A-framed roofs ranging from 1900 to 2500 square feet.",
    image_url: "/img/Beach-houses-1500.jpg",
    published_at: "2024-07-26",
    content: {
      markdown: "At Sunrise Construction, we pride ourselves on understanding the unique needs of our clients, especially in the distinct coastal environment of the Outer Banks. This region presents specific challenges, from high winds to salty air, and our Salt Box roofing system is designed to meet these challenges head-on. Here's why we offer this specialized package and the meticulous procedure we follow to ensure a durable and reliable installation.\n\n#### Understanding the Outer Banks Environment\n\nThe Outer Banks is renowned for its stunning coastal beauty, but it also brings its fair share of harsh weather conditions. High winds, salt-laden air, and heavy rains can take a toll on residential roofs. Homeowners here need a roofing system that can withstand these elements while remaining cost-effective. That's where our Salt Box roofing system comes in.\n\n#### The Salt Box Roofing System: Strong, Dependable, and Budget-Friendly\n\nThe Salt Box system is our base-tier offering, designed specifically for A-framed roofs ranging from 1900 to 2500 square feet. It combines strength, reliability, and affordability, making it an ideal choice for many homeowners in the Outer Banks.\n\n**Key Features of the Salt Box System:**\n\n- **Tamko Heritage Architectural Shingles:** These shingles offer a wood-shake look and beauty, with a fiberglass mat construction and a self-sealing strip of asphalt.\n- **Tamko Starter and Ridge Cap:** Essential components for a robust roofing system, providing additional layers of protection.\n- **Ice & Water Shield:** Installed in vulnerable areas such as eaves, rake edges, overhangs, and valleys.\n- **ABC Synthetic Underlayment:** Slip-resistant, durable, and resistant to UV rays and moisture.\n- **Stainless Steel Roof Nails:** Superior corrosion resistance, ideal for the salty air of coastal climates.\n- **Composite Vents and Pipe Collars:** Durable and reliable components that contribute to the overall strength of the roofing system.\n- **F8 Drip Edge:** Directs water away from the fascia, preventing water damage.\n\n#### Our Installation Procedure\n\nAt Sunrise Construction, we follow a meticulous procedure to ensure each Salt Box roofing system is installed to the highest standards.\n\n**1. Inspection and Preparation**\n- We begin with a thorough inspection of the existing roof structure to identify any underlying issues that need to be addressed.\n- The area is then prepared by removing old roofing materials and ensuring a clean, smooth surface for installation.\n\n**2. Installing the Ice & Water Shield**\n- We apply two rows of ice & water shield at the eaves and one row at the gables to protect against water infiltration in vulnerable areas.\n\n**3. Applying the Underlayment**\n- Next, we install the ABC synthetic underlayment. Its slip-resistant and durable properties ensure a secure and lasting foundation for the shingles.\n\n**4. Placing the Drip Edge**\n- The F8 drip edge is installed along the roof edges to direct water into the gutters and away from the fascia.\n\n**5. Installing the Shingles**\n- We then lay down the Tamko starter shingles, followed by the Heritage architectural shingles, ensuring a tight and secure fit.\n\n**6. Securing with Stainless Steel Nails**\n- Throughout the process, we use stainless steel roof nails to ensure the entire roofing system is securely fastened and resistant to corrosion.\n\n**7. Final Touches**\n- Composite vents and pipe collars are installed to ensure proper ventilation and sealing around roof penetrations.\n\n**8. Quality Check and Clean-Up**\n- Once the installation is complete, we conduct a thorough quality check to ensure everything meets our high standards.\n\n#### The Sunrise Construction Promise\n\nWith our Salt Box roofing system, you not only get a strong and dependable roof but also the peace of mind that comes with our 10-year craftsmanship warranty. At Sunrise Construction, we are committed to delivering quality and value, ensuring your home is protected and looking great for years to come.\n\nIf you're looking for a reliable roofing solution in the Outer Banks, look no further than the Salt Box roofing system by Sunrise Construction. Contact us today to learn more and schedule your installation.",
      categories: ["Outer Banks", "Roofing"],
      author: { name: "Zachary Wayland", avatar: "/img/hardhat.jpeg" },
      gallery: { enabled: false, items: [] as { image: string; alt: string }[], cols: 3 },
      additional: { enabled: false, content: "" },
    },
  },
  {
    slug: "wincore",
    title: "Building With Wincore",
    excerpt: "Building for the Outer Banks & Related Musings.",
    image_url: "/img/wincore.png",
    published_at: "2024-07-26",
    content: {
      markdown: "When it comes to building homes in the Outer Banks, our company, Sunrise Construction, understands the unique challenges and requirements posed by the coastal environment. From the constant threat of high winds and water to the corrosive effects of salt and sand, constructing durable and resilient homes is our top priority. That's why we choose Wincore windows for our projects.\n\n## The Wincore Advantage\n1. Superior Design and Durability\nWincore 500 Series windows are specifically designed to handle the extreme conditions of coastal areas. With their brickmold frame and integral J-channel, these windows offer a seamless fit with both brick and siding exteriors.\n\n2. Energy Efficiency\nWincore windows feature dual-paned glass with optional Low E glass and Argon gas fill. This combination maximizes energy efficiency by keeping homes warmer in the winter and cooler in the summer.\n\n3. Enhanced Protection\nThe windows are equipped with a U-channel spacer system that moderates outside air before it hits the inside sash, further enhancing energy efficiency.\n\n4. Customization Options\nWincore offers a variety of exterior and interior colors, allowing homeowners to customize their windows to match their personal style.\n\n## Our Installation Procedure\nAt Sunrise Construction, we follow a meticulous procedure to ensure that every Wincore window is installed to perfection.\n\nStep 1: Site Preparation\nBefore installation begins, we thoroughly inspect the site and prepare the window openings.\n\nStep 2: Placing the Windows\nWe carefully place the Wincore windows into the prepared openings, ensuring a tight fit.\n\nStep 3: Securing and Sealing\nOnce the windows are in place, we secure them using the appropriate fasteners. We then apply high-quality sealants around the edges.\n\nStep 4: Insulation and Weatherproofing\nTo further enhance the energy efficiency of the windows, we add insulation around the frames.\n\nStep 5: Final Inspection\nAfter installation, we conduct a thorough inspection to ensure that each window operates smoothly.\n\nStep 6: Cleanup and Customer Walkthrough\nWe believe in leaving the job site cleaner than we found it.\n\n### Wincore Certified\n\nAt Sunrise Construction, we are committed to building homes that stand the test of time in the challenging environment of the Outer Banks. By choosing Wincore windows, we provide our clients with superior design, enhanced protection, and exceptional energy efficiency.\n\nIf you're considering building or renovating a home in the Outer Banks, trust Sunrise Construction to deliver quality and reliability with Wincore windows. Contact us today to learn more about our services and how we can help you build your dream home.",
      categories: ["Construction", "Outer Banks", "Wincore", "Window Installation"],
      author: { name: "Zachary Wayland", avatar: "/img/hardhat.jpeg" },
      gallery: { enabled: false, items: [] as { image: string; alt: string }[], cols: 3 },
      additional: { enabled: false, content: "" },
    },
  },
  {
    slug: "metadata",
    title: "Metadata",
    excerpt: "Work, metadata",
    image_url: "/img/Beach-houses-1500.jpg",
    published_at: "2024-07-26",
    content: {
      markdown: "At Sunrise Construction, we pride ourselves on understanding the unique needs of our clients, especially in the distinct coastal environment of the Outer Banks. This region presents specific challenges, from high winds to salty air, and our Salt Box roofing system is designed to meet these challenges head-on.\n\n#### Understanding the Outer Banks Environment\n\nThe Outer Banks is renowned for its stunning coastal beauty, but it also brings its fair share of harsh weather conditions. High winds, salt-laden air, and heavy rains can take a toll on residential roofs. Homeowners here need a roofing system that can withstand these elements while remaining cost-effective.",
      categories: ["Outer Banks", "Roofing"],
      author: { name: "Zachary Wayland", avatar: "/img/hardhat.jpeg" },
      gallery: { enabled: false, items: [] as { image: string; alt: string }[], cols: 3 },
      additional: { enabled: false, content: "" },
    },
  },
];

async function seedBlogPosts(pool: pg.Pool): Promise<void> {
  const existing = await pool.query("SELECT count(*)::int AS cnt FROM cms_posts");
  if (existing.rows[0].cnt > 0) {
    console.log(`cms_posts already has ${existing.rows[0].cnt} rows — skipping blog seed`);
    return;
  }

  for (const post of SEED_BLOG_POSTS) {
    await pool.query(
      `INSERT INTO cms_posts (slug, title, excerpt, content, image_url, status, published_at)
       VALUES ($1, $2, $3, $4, $5, 'published', $6)`,
      [post.slug, post.title, post.excerpt, JSON.stringify(post.content), post.image_url, post.published_at]
    );
  }
  console.log(`Seeded ${SEED_BLOG_POSTS.length} blog posts`);
}

const JOBS_MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(200),
  phone VARCHAR(20),
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(10),
  zip VARCHAR(20),
  password_hash VARCHAR(255),
  totp_secret VARCHAR(64),
  totp_enabled BOOLEAN DEFAULT false,
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(30) DEFAULT 'draft',
  service_type VARCHAR(100),
  job_address_line1 VARCHAR(255),
  job_address_city VARCHAR(100),
  job_address_state VARCHAR(10),
  job_address_zip VARCHAR(20),
  contract_amount NUMERIC(12,2),
  deposit_amount NUMERIC(12,2),
  deposit_paid BOOLEAN DEFAULT false,
  estimated_start DATE,
  estimated_end DATE,
  actual_start DATE,
  actual_end DATE,
  assigned_to UUID REFERENCES users(id),
  permit_number VARCHAR(100),
  permit_status VARCHAR(30),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS job_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT false,
  event_type VARCHAR(30) DEFAULT 'work',
  created_by_type VARCHAR(10) DEFAULT 'admin',
  created_by_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_change_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  amount NUMERIC(12,2),
  status VARCHAR(20) DEFAULT 'pending',
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agreement_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  boilerplate_html TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  template_id UUID REFERENCES agreement_templates(id),
  scope_of_work_html TEXT NOT NULL,
  compensation_html TEXT NOT NULL,
  full_html TEXT,
  pdf_path VARCHAR(500),
  status VARCHAR(20) DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  signature_data TEXT,
  signer_ip INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  stripe_payment_intent_id VARCHAR(255),
  amount NUMERIC(12,2) NOT NULL,
  description VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  payment_type VARCHAR(20),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_otp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  code_hash VARCHAR(64) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_job_number ON jobs(job_number);
CREATE INDEX IF NOT EXISTS idx_job_milestones_job_id ON job_milestones(job_id);
CREATE INDEX IF NOT EXISTS idx_job_events_job_id ON job_events(job_id);
CREATE INDEX IF NOT EXISTS idx_job_events_start ON job_events(start_time);
CREATE INDEX IF NOT EXISTS idx_job_change_orders_job_id ON job_change_orders(job_id);
CREATE INDEX IF NOT EXISTS idx_job_agreements_job_id ON job_agreements(job_id);
CREATE INDEX IF NOT EXISTS idx_job_payments_job_id ON job_payments(job_id);
CREATE INDEX IF NOT EXISTS idx_customer_otp_email ON customer_otp(email);

CREATE TABLE IF NOT EXISTS job_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  caption TEXT,
  phase VARCHAR(100),
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  doc_type VARCHAR(50),
  url VARCHAR(500) NOT NULL,
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  sender_type VARCHAR(10) NOT NULL DEFAULT 'admin',
  sender_id UUID,
  sender_name VARCHAR(200),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_punch_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  item VARCHAR(500) NOT NULL,
  status VARCHAR(20) DEFAULT 'open',
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES jobs(id);
CREATE INDEX IF NOT EXISTS idx_invoices_job_id ON invoices(job_id);

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_number VARCHAR(50) UNIQUE NOT NULL,
  client_name VARCHAR(200) NOT NULL,
  client_email VARCHAR(255),
  client_address TEXT,
  client_phone VARCHAR(50),
  job_address TEXT,
  description TEXT,
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,4) DEFAULT 0,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  valid_until DATE,
  status VARCHAR(20) DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  job_id UUID REFERENCES jobs(id),
  pdf_path VARCHAR(500),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_estimates_status ON estimates(status);

CREATE INDEX IF NOT EXISTS idx_job_photos_job_id ON job_photos(job_id);
CREATE INDEX IF NOT EXISTS idx_job_documents_job_id ON job_documents(job_id);
CREATE INDEX IF NOT EXISTS idx_job_messages_job_id ON job_messages(job_id);
CREATE INDEX IF NOT EXISTS idx_job_punch_list_job_id ON job_punch_list(job_id);

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  customer_email VARCHAR(255),
  subject VARCHAR(500) NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  status VARCHAR(20) DEFAULT 'open',
  priority VARCHAR(20) DEFAULT 'normal',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_type VARCHAR(10) NOT NULL DEFAULT 'customer',
  sender_id UUID,
  sender_name VARCHAR(200),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_customer ON support_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON support_messages(ticket_id);
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
  await pool.query(JOBS_MIGRATION_SQL);
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

  // Seed blog posts
  await seedBlogPosts(pool);

  // Seed agreement template
  await seedAgreementTemplate(pool);
}

async function seedAgreementTemplate(pool: pg.Pool): Promise<void> {
  const existing = await pool.query("SELECT count(*)::int AS cnt FROM agreement_templates");
  const isUpdate = existing.rows[0].cnt > 0;

  const boilerplate = `
<p>2. The Services will also include any other tasks which the Parties may agree on. The Contractor hereby agrees to provide such Services to the Client.</p>

<h4>Term of Agreement</h4>

<p>3. The term of this Agreement (the &ldquo;Term&rdquo;) will begin on the date of this Agreement and will remain in full force and effect until the completion of the Services, subject to earlier termination as provided in this Agreement. The Term of this Agreement may be extended by mutual written agreement of the Parties.</p>

<p>4. In the event that either Party breaches a material provision under this Agreement, the non-defaulting Party may terminate this Agreement and require the defaulting Party to indemnify the non-defaulting Party against all reasonable damages.</p>

<h4>Performance</h4>

<p>5. The Parties agree to do everything necessary to ensure that the terms of this Agreement take effect.</p>

<h4>Currency</h4>

<p>6. Except as otherwise provided in this Agreement, all monetary amounts referred to in this Agreement are in USD (United States Dollars).</p>

<h4>Reimbursement of Expenses</h4>

<p>10. In connection with providing the Services hereunder, the Contractor will only be reimbursed for expenses that have been approved in advance by the Client.</p>

<p>11. The Contractor will furnish vouchers to the Client for all such expenses.</p>

<h4>Ownership of Materials and Intellectual Property</h4>

<p>12. All intellectual property and related materials (the &ldquo;Intellectual Property&rdquo;), including any related work in progress that is developed or produced under this Agreement, will be the property of the Contractor. The Client is granted a non-exclusive, limited-use license of this Intellectual Property.</p>

<p>13. Title, copyright, intellectual property rights, and distribution rights of the Intellectual Property remain exclusively with the Contractor.</p>

<h4>Return of Property</h4>

<p>14. Upon the expiry or termination of this Agreement, the Contractor will return to the Client any property, documentation, records, or Confidential Information which is the property of the Client.</p>

<h4>Capacity / Independent Contractor</h4>

<p>15. In providing the Services under this Agreement, it is expressly agreed that the Contractor is acting as an independent contractor and not as an employee. The Contractor and the Client acknowledge that this Agreement does not create a partnership or joint venture between them, and is exclusively a contract for service.</p>

<h4>Indemnification</h4>

<p>17. Except to the extent paid in settlement from any applicable insurance policies, and to the extent permitted by applicable law, each Party agrees to indemnify and hold harmless the other Party, and its respective affiliates, officers, agents, employees, and permitted successors and assigns against any and all claims, losses, damages, liabilities, penalties, punitive damages, expenses, reasonable legal fees, and costs of any kind or amount whatsoever, which result from or arise out of any act or omission of the indemnifying Party, its respective affiliates, officers, agents, employees, and permitted successors and assigns that occurs in connection with this Agreement. This indemnification will survive the termination of this Agreement.</p>

<h4>Insurance</h4>

<p>18. The Contractor will be required to maintain general liability insurance, including coverage for bodily injury and property damage, at a level that would be considered reasonable in the industry of the Contractor based on the risk associated with the characteristics of this Agreement and only to the extent permitted by law. All insurance policies will remain materially unchanged for the duration of this Agreement.</p>

<h4>Legal Expenses</h4>

<p>19. In the event that legal action is brought to enforce or interpret any term of this Agreement, the prevailing Party will be entitled to recover, in addition to any other damages or award, all reasonable legal costs and fees associated with the action.</p>

<h4>Modification of Agreement</h4>

<p>20. Any amendment or modification of this Agreement, or additional obligation assumed by either Party in connection with this Agreement, will only be binding if evidenced in writing signed by each Party or an authorized representative of each Party.</p>

<h4>Time of the Essence</h4>

<p>21. Time is of the essence in this Agreement. No extension or variation of this Agreement will operate as a waiver of this provision.</p>

<h4>Entire Agreement</h4>

<p>22. It is agreed that there is no representation, warranty, collateral agreement, or condition affecting this Agreement except as expressly provided in this Agreement.</p>

<h4>Governing Law</h4>

<p>23. This Agreement shall be governed by and construed in accordance with the laws of the State of North Carolina.</p>
`;

  if (isUpdate) {
    await pool.query(
      `UPDATE agreement_templates SET boilerplate_html = $1, description = $2 WHERE name = $3`,
      [
        boilerplate,
        "Default boilerplate for all Sunrise Construction independent contractor agreements (sections 2-23).",
        "Standard Independent Contractor Agreement",
      ]
    );
    console.log("Updated agreement template boilerplate");
  } else {
    await pool.query(
      `INSERT INTO agreement_templates (name, description, boilerplate_html)
       VALUES ($1, $2, $3)`,
      [
        "Standard Independent Contractor Agreement",
        "Default boilerplate for all Sunrise Construction independent contractor agreements (sections 2-23).",
        boilerplate,
      ]
    );
    console.log("Seeded agreement template");
  }
}
