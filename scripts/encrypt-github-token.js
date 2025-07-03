#!/usr/bin/env node

/**
 * GitHub Token Encryption Utility for Sunrise Construction CMS
 * 
 * Usage: node scripts/encrypt-github-token.js "your-github-token" "your-master-password"
 * 
 * This script encrypts your GitHub Personal Access Token with your master password.
 * Use the encrypted token in your NEXT_PUBLIC_ENCRYPTED_GITHUB_TOKEN environment variable.
 */

const crypto = require('crypto');

function encryptToken(token, password) {
  // Use the same method as CryptoJS AES for compatibility
  const CryptoJS = require('crypto-js');
  
  try {
    const encrypted = CryptoJS.AES.encrypt(token, password).toString();
    return encrypted;
  } catch (error) {
    throw new Error('Failed to encrypt token: ' + error.message);
  }
}

// Get arguments from command line
const token = process.argv[2];
const password = process.argv[3];

if (!token || !password) {
  console.error('Usage: node scripts/encrypt-github-token.js "your-github-token" "your-master-password"');
  console.error('');
  console.error('Example:');
  console.error('  node scripts/encrypt-github-token.js "ghp_xxxxxxxxxxxxxxxxxxxx" "mySecurePassword123"');
  console.error('');
  console.error('Steps:');
  console.error('  1. Create a GitHub Personal Access Token with "repo" permissions');
  console.error('  2. Run this script with your token and master password');
  console.error('  3. Add the encrypted token to your environment variables');
  process.exit(1);
}

if (password.length < 8) {
  console.error('Warning: Password should be at least 8 characters long for security.');
}

if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
  console.error('Warning: This doesn\'t look like a valid GitHub Personal Access Token.');
  console.error('GitHub tokens usually start with "ghp_" or "github_pat_"');
}

try {
  const encryptedToken = encryptToken(token, password);
  
  console.log('\n=== GitHub Token Encryption Result ===');
  console.log('Original Token:', token.substring(0, 8) + '...' + token.substring(token.length - 4));
  console.log('Master Password:', password);
  console.log('Encrypted Token:', encryptedToken);
  console.log('\nAdd this to your environment variables:');
  console.log(`NEXT_PUBLIC_ENCRYPTED_GITHUB_TOKEN=${encryptedToken}`);
  console.log('\nSecurity Notes:');
  console.log('- Keep your master password secure and never commit it to version control');
  console.log('- The encrypted token is safe to store in environment variables');
  console.log('- Only someone with your master password can decrypt and use the token');
  console.log('- Regularly rotate your GitHub tokens for security');
  
} catch (error) {
  console.error('Error encrypting token:', error.message);
  process.exit(1);
}
