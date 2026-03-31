import { TOTP, Secret } from "otpauth";
import crypto from "crypto";
import * as QRCode from "qrcode";

const ISSUER = "Sprimage";
const DIGITS = 6;
const PERIOD = 30;
const WINDOW = 1;

export function generateSecret(): string {
  const secret = new Secret({ size: 20 });
  return secret.base32;
}

function createTOTP(secret: string, email: string): TOTP {
  return new TOTP({
    issuer: ISSUER,
    label: email,
    algorithm: "SHA1",
    digits: DIGITS,
    period: PERIOD,
    secret: Secret.fromBase32(secret),
  });
}

export function getTotpUri(secret: string, email: string): string {
  return createTOTP(secret, email).toString();
}

export async function generateQRDataUri(uri: string): Promise<string> {
  return QRCode.toDataURL(uri, { width: 256, margin: 2 });
}

export function validateCode(secret: string, email: string, code: string): boolean {
  const totp = createTOTP(secret, email);
  const delta = totp.validate({ token: code, window: WINDOW });
  return delta !== null;
}

export function generateRecoveryCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(crypto.randomBytes(4).toString("hex").toUpperCase());
  }
  return codes;
}

export function hashRecoveryCode(code: string): string {
  return crypto.createHash("sha256").update(code.toUpperCase()).digest("hex");
}
