// Fully client-side, fully fake JWT simulation. No signing, no crypto, no network.
// Structurally identical to a real JWT (base64url(header).base64url(payload).signature)
// so it decodes exactly like a real one would — the *signature* segment is a inert
// placeholder string, never a real cryptographic signature.

export interface JwtHeader {
  alg: string
  typ: 'JWT'
  kid: string
}

export interface ActorClaim {
  sub: string
  iss: string
}

export interface JwtPayload {
  iss: string
  sub: string
  aud: string
  scope?: string
  act?: ActorClaim
  client_id?: string
  iat: number
  exp: number
  jti: string
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

function fakeSignature(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
  const rand = mulberry32(hash || 1)
  let out = ''
  for (let i = 0; i < 43; i++) {
    out += chars[Math.floor(rand() * chars.length)]
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

let counter = 0
export function jti(prefix: string): string {
  counter += 1
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}`
}
