#!/usr/bin/env node

/**
 * Password Hash Generator for Sunrise Construction CMS
 * 
 * Usage: node scripts/generate-password-hash.js "your-password"
 * 
 * This script generates a PBKDF2 hash for the CMS master password.
 * Use the generated hash in your NEXT_PUBLIC_MASTER_PASSWORD_HASH environment variable.
 */

const crypto = require('crypto');

function generatePasswordHash(password) {
  const salt = 'sunrise-cms-salt-2024';
  const iterations = 10000;
  const keyLength = 32; // 256 bits / 8
  
  const hash = crypto.pbkdf2Sync(password, salt, iterations, keyLength, 'sha256');
  return hash.toString('hex');
}

// Get password from command line argument
const password = process.argv[2];

if (!password) {
  console.error('Usage: node scripts/generate-password-hash.js "your-password"');
  console.error('Example: node scripts/generate-password-hash.js "mySecurePassword123"');
  process.exit(1);
}

if (password.length < 8) {
  console.error('Warning: Password should be at least 8 characters long for security.');
}

const hash = generatePasswordHash(password);

console.log('\n=== Sunrise Construction CMS Password Hash ===');
console.log('Password:', password);
console.log('Generated Hash:', hash);
console.log('\nAdd this to your environment variables:');
console.log(`NEXT_PUBLIC_MASTER_PASSWORD_HASH=${hash}`);
console.log('\nKeep your password secure and never commit it to version control!');