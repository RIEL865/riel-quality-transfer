const { getSession, clearSessionCookie } = require('./session');

module.exports = async (req, res) => {
  try {
    const session = await getSession(req, res);
    if (session && process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET) {
      const body = new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY,
        client_secret: process.env.TIKTOK_CLIENT_SECRET,
        token: session.access_token
      });
      await fetch('https://open.tiktokapis.com/v2/oauth/revoke/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
    }
    res.setHeader('Set-Cookie', clearSessionCookie());
    res.setHeader('Cache-Control', 'no-store');
    res.redirect('/');
  } catch (e) {
    console.error(e);
    res.setHeader('Set-Cookie', clearSessionCookie());
    res.redirect('/');
  }
};
