// Fully client-side, fully fake JWT simulation. No signing, no crypto, no network.
// Structurally identical to a real JWT (base64url(header).base64url(payload).signature)
// so it decodes exactly like a real one would — the *signature* segment is an inert
// placeholder string, never a real cryptographic signature.

export interface JwtHeader {
  alg: string
  typ: string
  kid: string
}

export interface ActorClaim {
  sub: string
  iss?: string
  client_id?: string
}

export interface JwtPayload {
  iss: string
  sub: string
  aud: string
  iat: number
  exp: number
  jti: string
  scope?: string
  act?: ActorClaim
  client_id?: string
  [key: string]: unknown
}

function base64url(input: string): string {
  const bytes = new TextEncoder().encode(input)
  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64urlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/')
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  const binary = atob(padded + pad)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

// Deterministic-looking but inert "signature". Real signatures are computed over
// the header+payload with a private key; this one is just theatre for the demo.
// Uses mulberry32 rather than a naive LCG — a plain `(x * a + c) % 2^32` LCG's
// low bits (the ones `% chars.length` would read) cycle very short and visibly
// degenerate into runs of the same character.
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashString(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return hash
}

const SIG_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

function fakeSignature(seed: string, length = 43): string {
  const rand = mulberry32(hashString(seed) || 1)
  let out = ''
  for (let i = 0; i < length; i++) {
    out += SIG_CHARS[Math.floor(rand() * SIG_CHARS.length)]
  }
  return out
}

export function makeJwt(header: JwtHeader, payload: JwtPayload): string {
  const h = base64url(JSON.stringify(header))
  const p = base64url(JSON.stringify(payload))
  const s = fakeSignature(h + p)
  return `${h}.${p}.${s}`
}

export interface DecodedJwt {
  header: JwtHeader
  payload: JwtPayload
  signature: string
  raw: { header: string; payload: string; signature: string }
}

export function decodeJwt(token: string): DecodedJwt {
  const [h, p, s] = token.split('.')
  return {
    header: JSON.parse(base64urlDecode(h)),
    payload: JSON.parse(base64urlDecode(p)),
    signature: s,
    raw: { header: h, payload: p, signature: s },
  }
}

/**
 * Re-encode a token's payload with `patch` applied while keeping the ORIGINAL
 * signature segment. That is exactly what a holder of a bearer token can do: the
 * payload is only base64url-encoded, not encrypted. The result is a structurally
 * valid JWT whose signature no longer matches its payload — which is the entire
 * point of the demo's "tampered payload" condition.
 */
export function tamperJwt(token: string, patch: Record<string, unknown>): string {
  const { header, payload, raw } = decodeJwt(token)
  const nextPayload = { ...payload, ...patch }
  const h = base64url(JSON.stringify(header))
  const p = base64url(JSON.stringify(nextPayload))
  return `${h}.${p}.${raw.signature}`
}

/** True when the signature segment matches what this (simulated) issuer would have produced. */
export function signatureIsValid(token: string): boolean {
  const [h, p, s] = token.split('.')
  return fakeSignature(h + p) === s
}

/** Short, stable, human-comparable id for a token — used on chips and diff headers. */
export function fingerprint(token: string): string {
  return fakeSignature(token, 8).toLowerCase()
}

let counter = 0
export function jti(prefix: string): string {
  counter += 1
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}`
}

/** Compact display form: first/last few characters of each segment. */
export function abbreviate(token: string, keep = 6): string {
  return token
    .split('.')
    .map((seg) => (seg.length <= keep * 2 + 1 ? seg : `${seg.slice(0, keep)}…${seg.slice(-keep)}`))
    .join('.')
}
