const crypto = require('crypto');

function cookie(name, value, maxAge = 600) {
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

module.exports = async (req, res) => {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const redirectUri = process.env.TIKTOK_REDIRECT_URI;
  if (!clientKey || !redirectUri) return res.status(500).send('TikTok is not configured yet.');

  const state = crypto.randomBytes(32).toString('hex');
  res.setHeader('Set-Cookie', cookie('tt_state', state));

  const params = new URLSearchParams({
    client_key: clientKey,
    response_type: 'code',
    scope: 'user.info.basic,video.publish',
    redirect_uri: redirectUri,
    state
  });
  res.redirect(`https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`);
};
