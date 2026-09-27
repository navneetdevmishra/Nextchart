import * as crypto from 'crypto';

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(input: string): Buffer {
  const cleaned = input.toUpperCase().replace(/=+$/, '').replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const index = BASE32_CHARS.indexOf(cleaned[i]);
    if (index === -1) continue;

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

export class TotpUtil {
  static generateSecret(length = 20): string {
    const randomBytes = crypto.randomBytes(length);
    return base32Encode(randomBytes);
  }

  static generateOTP(secret: string, windowOffset = 0): string {
    const key = base32Decode(secret);
    const counter = Math.floor(Date.now() / 1000 / 30) + windowOffset;

    const buffer = Buffer.alloc(8);
    let tempCounter = counter;
    for (let i = 7; i >= 0; i--) {
      buffer[i] = tempCounter & 0xff;
      tempCounter = tempCounter >> 8;
    }

    const hmac = crypto.createHmac('sha1', key).update(buffer).digest();
    const offset = hmac[hmac.length - 1] & 0xf;
    const code =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    const otp = (code % 1000000).toString().padStart(6, '0');
    return otp;
  }

  static verify(secret: string, token: string, window = 1): boolean {
    const cleanToken = token.trim();
    for (let errorWindow = -window; errorWindow <= window; errorWindow++) {
      const generated = this.generateOTP(secret, errorWindow);
      if (generated === cleanToken) {
        return true;
      }
    }
    return false;
  }

  static getOtpauthUrl(label: string, issuer: string, secret: string): string {
    return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
  }
}
