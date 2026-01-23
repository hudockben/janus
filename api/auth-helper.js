import { sql } from '@vercel/postgres';
import crypto from 'crypto';

// Hash password using crypto
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

// Verify password
export function verifyPassword(password, salt, hash) {
  const hashVerify = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === hashVerify;
}

// Generate JWT-like token with user data encoded
export function generateToken(userId, email) {
  const payload = {
    userId,
    email,
    iat: Date.now()
  };
  const payloadStr = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadStr).toString('base64');

  // Sign with secret
  const secret = process.env.JWT_SECRET || 'default-secret-change-in-production';
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64');

  return `${payloadB64}.${signature}`;
}

// Verify and decode token
export function verifyToken(token) {
  if (!token) return null;

  try {
    const [payloadB64, signature] = token.split('.');
    if (!payloadB64 || !signature) return null;

    // Verify signature
    const secret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadB64)
      .digest('base64');

    if (signature !== expectedSignature) return null;

    // Decode payload
    const payloadStr = Buffer.from(payloadB64, 'base64').toString('utf-8');
    const payload = JSON.parse(payloadStr);

    return payload;
  } catch (err) {
    console.error('Token verification failed:', err);
    return null;
  }
}

// Ensure users table exists
export async function ensureUsersTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      name TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

// CORS headers helper
export function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Verify authentication token and return user info
export async function getUserFromToken(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  const payload = verifyToken(token);

  if (!payload) {
    return null;
  }

  // Verify user still exists in database
  const { rows } = await sql`
    SELECT id, email, name FROM users WHERE id = ${payload.userId}
  `;

  if (rows.length === 0) {
    return null;
  }

  return {
    userId: payload.userId,
    email: payload.email,
    user: rows[0]
  };
}

// Middleware to require authentication
export async function requireAuth(req, res) {
  const auth = await getUserFromToken(req);

  if (!auth) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }

  return auth;
}
