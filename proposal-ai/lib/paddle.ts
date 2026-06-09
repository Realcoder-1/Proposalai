import crypto from 'crypto'

// Paddle Classic webhook verification
// Uses the public key from your Paddle dashboard
export function verifyPaddleWebhook(body: Record<string, any>): boolean {
  try {
    const publicKey = process.env.PADDLE_PUBLIC_KEY!
    const signature = body.p_signature

    if (!signature) return false

    // Remove signature from body before verification
    const { p_signature, ...rest } = body

    // Sort keys alphabetically and serialize
    const sorted = Object.keys(rest)
      .sort()
      .reduce((acc: Record<string, any>, key) => {
        acc[key] = rest[key]
        return acc
      }, {})

    const serialized = Object.entries(sorted)
      .map(([k, v]) => `${k}=${Array.isArray(v) ? v.join(',') : v}`)
      .join(':')

    // PHP-style serialize (Paddle Classic requirement)
    const phpSerialized = phpSerialize(sorted)

    const verify = crypto.createVerify('SHA1')
    verify.update(phpSerialized)
    const isValid = verify.verify(publicKey, signature, 'base64')

    return isValid
  } catch (err) {
    console.error('Paddle verification error:', err)
    return false
  }
}

// PHP serialize implementation for Paddle Classic
function phpSerialize(obj: Record<string, any>): string {
  const keys = Object.keys(obj).sort()
  let result = `a:${keys.length}:{`
  for (const key of keys) {
    const val = obj[key]
    result += phpSerializeValue(key)
    result += phpSerializeValue(val)
  }
  result += '}'
  return result
}

function phpSerializeValue(val: any): string {
  if (typeof val === 'string') return `s:${Buffer.byteLength(val)}:"${val}";`
  if (typeof val === 'number') return Number.isInteger(val) ? `i:${val};` : `d:${val};`
  if (typeof val === 'boolean') return `b:${val ? 1 : 0};`
  if (val === null) return 'N;'
  return `s:${Buffer.byteLength(String(val))}:"${String(val)}";`
}
