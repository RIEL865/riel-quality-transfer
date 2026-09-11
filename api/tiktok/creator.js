const { parseCookies, decrypt } = require('./session');

module.exports = async (req, res) => {
  try {
    const cookies = parseCookies(req);
    if (!cookies.tt_session || !process.env.SESSION_SECRET) return res.status(401).json({ error: 'not_connected' });
    const session = decrypt(cookies.tt_session, process.env.SESSION_SECRET);
    const r = await fetch('https://open.tiktokapis.com/v2/post/publish/creator_info/query/', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: '{}'
    });
    const data = await r.json();
    if (!r.ok || data.error?.code !== 'ok') return res.status(r.status || 400).json(data);
    res.json(data.data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'creator_info_failed' });
  }
};
