// Pure crypto for admin session cookies. Importable from proxy.ts (no next/headers).
// HMAC-SHA256 over a JSON payload using the Web Crypto API; works on Node and Edge.

export interface SessionPayload {
  exp: number;
}

export const SESSION_COOKIE_NAME = 'admin_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 24;

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET environment variable is not set');
  }
  return secret;
}

function base64urlEncode(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str: string): Uint8Array {
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

let keyPromise: Promise<CryptoKey> | null = null;

function getHmacKey(): Promise<CryptoKey> {
  if (keyPromise) return keyPromise;
  const promise = crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  promise.catch(() => {
    if (keyPromise === promise) keyPromise = null;
  });
  keyPromise = promise;
  return promise;
}

async function hmacSha256(message: string): Promise<Uint8Array> {
  const key = await getHmacKey();
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(message),
  );
  return new Uint8Array(sig);
}

export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a[i] ^ b[i];
  return result === 0;
}

export async function signSession(payload: SessionPayload): Promise<string> {
  const json = JSON.stringify(payload);
  const payloadB64 = base64urlEncode(new TextEncoder().encode(json));
  const sig = await hmacSha256(payloadB64);
  return `${payloadB64}.${base64urlEncode(sig)}`;
}

export async function verifySession(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;

  let providedSig: Uint8Array;
  try {
    providedSig = base64urlDecode(sigB64);
  } catch {
    return null;
  }
  const expectedSig = await hmacSha256(payloadB64);
  if (!timingSafeEqual(expectedSig, providedSig)) return null;

  let payload: SessionPayload;
  try {
    const json = new TextDecoder().decode(base64urlDecode(payloadB64));
    payload = JSON.parse(json);
  } catch {
    return null;
  }
  if (typeof payload?.exp !== 'number') return null;
  if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
  return payload;
}
