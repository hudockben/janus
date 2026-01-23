import { setCorsHeaders } from '../auth-helper.js';

export default async function handler(req, res) {
  setCorsHeaders(res);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Logout is client-side only (just clear the token)
    console.log('User logged out');
    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({
      error: 'Server error: ' + err.message
    });
  }
}
