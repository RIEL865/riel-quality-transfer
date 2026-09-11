const { parseCookies, decrypt } = require('./session');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
    const cookies = parseCookies(req);
    if (!cookies.tt_session || !process.env.SESSION_SECRET) return res.status(401).json({ error: 'not_connected' });
    const session = decrypt(cookies.tt_session, process.env.SESSION_SECRET);
    const { title = '', privacy_level, disable_comment = false, disable_duet = false, disable_stitch = false, video_size } = req.body || {};
    if (!privacy_level || !Number.isFinite(Number(video_size)) || Number(video_size) <= 0) {
      return res.status(400).json({ error: 'privacy_level and video_size are required' });
    }
    const chunkSize = Math.min(10 * 1024 * 1024, Number(video_size));
    const totalChunkCount = Math.ceil(Number(video_size) / chunkSize);
    const body = {
      post_info: {
        title: String(title).slice(0, 2200),
        privacy_level,
        disable_comment: Boolean(disable_comment),
        disable_duet: Boolean(disable_duet),
        disable_stitch: Boolean(disable_stitch)
      },
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: Number(video_size),
        chunk_size: chunkSize,
        total_chunk_count: totalChunkCount
      }
    };
    const r = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify(body)
    });
    const data = await r.json();
    if (!r.ok || data.error?.code !== 'ok') return res.status(r.status || 400).json(data);
    res.json(data.data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'publish_init_failed' });
  }
};
