import { sql } from '@vercel/postgres';
import {
  verifyToken,
  ensureUsersTable,
  setCorsHeaders
} from '../auth-helper.js';

export default async function handler(req, res) {
  setCorsHeaders(res);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Ensure users table exists
    await ensureUsersTable();

    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const payload = verifyToken(token);

    if (!payload) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Get fresh user details
    const { rows } = await sql`
      SELECT id, email, name, created_at
      FROM users
      WHERE id = ${payload.userId}
    `;

    if (rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: rows[0].id,
        email: rows[0].email,
        name: rows[0].name,
        createdAt: rows[0].created_at
      }
    });

  } catch (err) {
    console.error('Verify error:', err);
    return res.status(500).json({
      error: 'Server error: ' + err.message,
      details: err.toString()
    });
  }
}
