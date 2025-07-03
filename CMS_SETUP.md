# Sunrise Construction CMS Setup Guide

## Overview
This CMS allows you to edit content directly from the browser and push changes to GitHub, triggering automatic Vercel deployments.

## Setup Steps

### 1. Create GitHub Personal Access Token
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name like "Sunrise CMS Token"
4. Select scopes:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
5. Copy the generated token

### 2. Generate Master Password Hash
Use the provided script to generate a secure password hash:

```bash
node scripts/generate-password-hash.js "your-secure-password"
```

This will output a PBKDF2 hash that you'll use in your environment variables.

### 3. Encrypt GitHub Token
For maximum security, encrypt your GitHub token with your master password:

```bash
node scripts/encrypt-github-token.js "your-github-token" "your-master-password"
```

This ensures that even if someone gains access to your environment variables, they cannot use your GitHub token without knowing your master password.

### 4. Environment Variables
Add these to your Vercel environment variables:

```bash
NEXT_PUBLIC_ENCRYPTED_GITHUB_TOKEN=your_encrypted_token_here
NEXT_PUBLIC_REPO_OWNER=your-github-username
NEXT_PUBLIC_REPO_NAME=sunriseobx.co
NEXT_PUBLIC_MASTER_PASSWORD_HASH=your_generated_hash_here
```

### 5. Vercel Deployment Settings
Ensure your Vercel project is connected to your GitHub repository with:
- Auto-deployments enabled on main/master branch
- Build command: `npm run build`
- Output directory: `.next`

## Usage

### Accessing the CMS
1. Navigate to `https://yourdomain.com/admin`
2. Enter your master password
3. Select files to edit from the sidebar
4. Make changes in the editor
5. Click "Save & Deploy" to push changes to GitHub

### Editable Files
The CMS currently supports editing these JSON files:
- `src/data/app.json` - Site configuration
- `src/data/sections/hero.json` - Hero section content
- `src/data/sections/about.json` - About section content
- `src/data/sections/services.json` - Services content
- `src/data/posts/posts.json` - Blog posts
- `src/data/projects/projects.json` - Project portfolio
- `src/data/team/team.json` - Team members
- `src/data/sliders/partners.json` - Partner logos

### Security Features
- PBKDF2 password hashing with 10,000 iterations
- AES-256 encryption of GitHub token with master password
- Client-side encryption of sensitive data
- Encrypted token stored as environment variable (useless without master password)
- No database required - all data in Git
- Double-layer security: password + encrypted token

## Workflow
1. Edit content in CMS → 
2. Save pushes to GitHub → 
3. Vercel auto-deploys → 
4. Site updates live

## Troubleshooting

### Common Issues
1. **"Invalid password"** - Check your password hash generation
2. **"Error updating file"** - Verify GitHub token permissions and encryption
3. **"Error loading file"** - Check repository name and file paths
4. **Deploy not triggering** - Verify Vercel GitHub integration
5. **"GitHub token not available"** - Check token encryption and master password

### Security Notes
- Never commit your GitHub token to the repository (use encrypted version)
- Use strong passwords for the master password (8+ characters)
- The encrypted token is useless without the master password
- Consider IP restrictions for the admin page in production
- Regularly rotate your GitHub tokens and re-encrypt them
- Store master password securely (password manager recommended)

## Extending the CMS
To add more editable files, update the `files` array in `src/pages/admin.jsx`:

```javascript
setFiles([
  'src/data/app.json',
  'src/data/your-new-file.json',
  // ... other files
]);
```

## Production Considerations
- Add IP whitelisting for `/admin` route
- Implement session timeouts
- Add audit logging
- Consider using GitHub Apps instead of personal tokens for better security
- Add file validation before saving
- Implement backup/restore functionality