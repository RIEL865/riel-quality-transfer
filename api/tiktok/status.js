const { parseCookies, decrypt } = require('./session');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
    const cookies = parseCookies(req);
    if (!cookies.tt_session || !process.env.SESSION_SECRET) return res.status(401).json({ error: 'not_connected' });
    const session = decrypt(cookies.tt_session, process.env.SESSION_SECRET);
    const { publish_id } = req.body || {};
    if (!publish_id) return res.status(400).json({ error: 'publish_id_required' });
    const r = await fetch('https://open.tiktokapis.com/v2/post/publish/status/fetch/', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({ publish_id })
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'status_failed' });
  }
};
