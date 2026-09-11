const crypto = require('crypto');

function parseCookies(req) {
  const out = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1));
  }
  return out;
}

function encrypt(value, secret) {
  const key = crypto.createHash('sha256').update(secret).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64url');
}

function sessionCookie(value) {
  return `tt_session=${encodeURIComponent(value)}; Path=/; Max-Age=604800; HttpOnly; Secure; SameSite=Lax`;
}

module.exports = async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query || {};
    const cookies = parseCookies(req);
    if (error) return res.redirect(`/?tiktok_error=${encodeURIComponent(error_description || error)}`);
    if (!code || !state || !cookies.tt_state || Buffer.byteLength(state) !== Buffer.byteLength(cookies.tt_state) || !crypto.timingSafeEqual(Buffer.from(state), Buffer.from(cookies.tt_state))) {
      return res.status(400).send('Invalid TikTok authorization state. Please try again.');
    }

    const body = new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY,
      client_secret: process.env.TIKTOK_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.TIKTOK_REDIRECT_URI
    });

    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    const data = await tokenResponse.json();
    if (!tokenResponse.ok || !data.access_token) {
      console.error('TikTok token exchange failed:', data);
      return res.redirect(`/?tiktok_error=${encodeURIComponent(data.error_description || data.error || 'Authorization failed')}`);
    }

    if (!process.env.SESSION_SECRET) return res.status(500).send('SESSION_SECRET is not configured.');
    const session = encrypt(JSON.stringify({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + (Number(data.expires_in || 86400) * 1000),
      refresh_expires_at: Date.now() + (Number(data.refresh_expires_in || 31536000) * 1000),
      open_id: data.open_id
    }), process.env.SESSION_SECRET);

    res.setHeader('Set-Cookie', [
      sessionCookie(session),
      'tt_state=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax'
    ]);
    res.redirect('/?tiktok=connected');
  } catch (e) {
    console.error(e);
    res.status(500).send('TikTok authorization failed.');
  }
};
