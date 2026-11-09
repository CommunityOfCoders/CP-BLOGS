import crypto from "crypto";

// Fallback secret if not set in environment
const ARENA_SECRET = process.env.ARENA_SECRET || "cp-club-battle-arena-secret-key-v1";

/**
 * Creates an HMAC SHA-256 signature for the given payload string.
 * @param {string} data - Base64URL-encoded JSON string
 * @returns {string} Base64URL-encoded signature
 */
function createSignature(data) {
  return crypto
    .createHmac("sha256", ARENA_SECRET)
    .update(data)
    .digest("base64url");
}

/**
 * Signs a match state payload into a tamper-proof compact token.
 * Format: `<base64url_payload>.<signature>`
 *
 * @param {Object} payload - The match state (p1, p2, problems, startTime, endTime, durationMinutes)
 * @returns {string} The signed match token
 */
export function signMatchToken(payload) {
  const jsonStr = JSON.stringify(payload);
  const data = Buffer.from(jsonStr, "utf8").toString("base64url");
  const signature = createSignature(data);
  return `${data}.${signature}`;
}

/**
 * Verifies and decodes a match token.
 * Returns the decoded payload if valid and untampered, or null if invalid.
 *
 * @param {string} token - The signed match token
 * @returns {Object|null} Decoded match payload or null
 */
export function verifyMatchToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return null;
  }

  const [data, signature] = token.split(".");
  if (!data || !signature) {
    return null;
  }

  const expectedSignature = createSignature(data);

  // Constant-time comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const jsonStr = Buffer.from(data, "base64url").toString("utf8");
    return JSON.parse(jsonStr);
  } catch (error) {
    return null;
  }
}
