---
name: sunrise
description: >
  Use when: managing the SunriseOBX platform via CLI — admin tasks, user management,
  CMS blog posts/projects, payroll/employees/paystubs, invoices, direct mail campaigns,
  Dare County parcel data, trading operations, API keys, or market data.
  Trigger words: sunrise, sunriseobx, sunrise-cli, admin, users, blog post, cms, payroll,
  employee, paystub, invoice, campaign, parcel, dare county, trading, api key, market data.
allowed-tools: Bash(sunrise-cli *)
---

# SunriseOBX Admin CLI Skill

You have access to `sunrise-cli`, the admin CLI for the SunriseOBX platform. It wraps the
full SunriseOBX API and supports every admin operation: auth, user management, CMS, payroll,
invoices, campaigns, parcels, trading, and market data.

## Authentication

The CLI stores its auth token at `~/.sunrise-token` after login.

```bash
# Login (stores token automatically)
sunrise-cli auth login --email admin@sunriseobx.co --password <PASSWORD>

# Check current user
sunrise-cli auth me

# Logout (clears stored token)
sunrise-cli auth logout
```

You can also pass `--token <TOKEN>` or set `SUNRISE_TOKEN` env var.

The default API URL is `https://api.sunriseobx.co`. Override with `--api-url` or `SUNRISE_API_URL`.

## Global Flags

- `--json` / `-j` — Output raw JSON instead of formatted tables
- `--api-url <URL>` — Override API base URL
- `--token <TOKEN>` — Provide auth token directly

## Command Reference

### Identity & Access Management (IAM)

```bash
# List all users
sunrise-cli iam users

# Create a user
sunrise-cli iam create-user --email user@example.com --password secret123 --name "John Doe" --role viewer

# Get user details
sunrise-cli iam get-user <USER_ID>

# Update user role/status
sunrise-cli iam update-user <USER_ID> --role admin
sunrise-cli iam update-user <USER_ID> --disabled true

# Delete (disable) a user
sunrise-cli iam delete-user <USER_ID>

# View audit log
sunrise-cli iam audit

# List active sessions
sunrise-cli iam sessions
```

**Roles:** superadmin, admin, manager, trader, viewer

### Content Management (CMS)

```bash
# List all blog posts (including drafts)
sunrise-cli cms posts

# Create a blog post
sunrise-cli cms create-post --slug my-post --title "My Post" --excerpt "Description" --image-url /img/photo.jpg --status published

# Update a blog post
sunrise-cli cms update-post <POST_ID> --title "New Title" --status draft

# Delete a blog post
sunrise-cli cms delete-post <POST_ID>

# List all projects
sunrise-cli cms projects

# Delete a project
sunrise-cli cms delete-project <PROJECT_ID>
```

**Post statuses:** draft, published

The `content` field is JSONB storing: `{ markdown, categories, author, gallery, additional }`.

### Payroll

```bash
# List employees
sunrise-cli payroll employees

# Get employee details
sunrise-cli payroll get-employee <EMPLOYEE_UUID>

# Create an employee
sunrise-cli payroll create-employee \
  --employee-id EMP001 \
  --name "Jane Smith" \
  --salary 75000 \
  --start-date 2024-01-15 \
  --email jane@sunriseobx.co \
  --department "Construction" \
  --title "Project Manager"

# List paystubs for an employee
sunrise-cli payroll paystubs <EMPLOYEE_UUID>

# Generate paystubs for a year (backfill)
sunrise-cli payroll generate <EMPLOYEE_UUID> --year 2024

# Get signed PDF URL for a paystub
sunrise-cli payroll pdf <PAYSTUB_ID>
```

### Invoices

```bash
# List all invoices
sunrise-cli invoices list

# Get invoice details
sunrise-cli invoices get <INVOICE_ID>

# Get signed PDF URL for an invoice
sunrise-cli invoices pdf <INVOICE_ID>
```

**Note:** Invoice creation with line items is complex and better done through the web dashboard.
The CLI can list and retrieve invoices and their PDF URLs.

### Campaigns (Direct Mail)

```bash
# List all campaigns
sunrise-cli campaigns list

# Get campaign details (includes recipient count)
sunrise-cli campaigns get <CAMPAIGN_ID>

# Create a campaign
sunrise-cli campaigns create --name "Spring Mailer" --subject "Roof Inspection Season"

# Populate recipients from the parcels database
sunrise-cli campaigns populate <CAMPAIGN_ID> --town "NAGS HEAD" --out-of-state true --min-value 500000

# Export recipients as CSV
sunrise-cli campaigns export <CAMPAIGN_ID>

# Delete a campaign
sunrise-cli campaigns delete <CAMPAIGN_ID>
```

### Parcels (Dare County GIS)

```bash
# Sync all parcels from GeoServer WFS (~48k records)
sunrise-cli parcels sync

# Get aggregate statistics
sunrise-cli parcels stats

# Search parcels by text
sunrise-cli parcels search "SMITH"

# Get a single parcel by number
sunrise-cli parcels get 000012000

# Filter parcels with criteria
sunrise-cli parcels filter --town "KILL DEVIL HILLS" --min-value 500000 --max-value 2000000
sunrise-cli parcels filter --owner "SMITH"
```

### Trading (Alpaca Markets)

```bash
# Show account info (equity, cash, buying power)
sunrise-cli trading account

# List open positions
sunrise-cli trading positions

# List orders
sunrise-cli trading orders

# Cancel an order
sunrise-cli trading cancel-order <ORDER_ID>
```

**Note:** Order creation is available through the API but not yet exposed in the CLI.
Use the web dashboard for placing orders.

### API Keys

```bash
# List API keys
sunrise-cli keys list

# Create a new API key (save the output — the key is only shown once)
sunrise-cli keys create --name "CI Pipeline"

# Revoke an API key
sunrise-cli keys revoke <KEY_ID>
```

### Market Data

```bash
# Market overview (indices, sector performance)
sunrise-cli market overview

# Top movers (gainers/losers)
sunrise-cli market movers

# Get snapshot for a symbol
sunrise-cli market snapshot AAPL

# Get OHLCV bars
sunrise-cli market bars AAPL --timeframe 1Day
sunrise-cli market bars TSLA --timeframe 1Hour --start 2024-01-01 --end 2024-01-31
```

## Tips

- Always authenticate first with `sunrise-cli auth login` before running admin commands.
- Use `-j` flag when you need to parse output programmatically or pipe to `jq`.
- The CLI reads `~/.sunrise-token` automatically — no need to pass `--token` after login.
- For bulk operations, use `--json` output and pipe through `jq` for filtering.
- Parcel filter results are capped at 20 rows in table mode; use `--json` for full output.
- Source `~/.sunriseenv` before running commands to load environment variables.
