const crypto = require('crypto');

const sessions = new Map();

module.exports = function session() {
  return (req, res, next) => {
    const cookies = {};
    const raw = req.headers.cookie || '';
    raw.split(';').forEach((part) => {
      const [key, ...rest] = part.trim().split('=');
      if (key) {
        cookies[key] = decodeURIComponent(rest.join('='));
      }
    });

    let sid = cookies.sid;
    if (!sid || !sessions.has(sid)) {
      sid = crypto.randomBytes(16).toString('hex');
      sessions.set(sid, {});
      res.setHeader('Set-Cookie', `sid=${sid}; Path=/; HttpOnly`);
    }

    const sessionData = sessions.get(sid);
    sessionData.destroy = (callback) => {
      sessions.delete(sid);
      res.setHeader('Set-Cookie', 'sid=; Path=/; Max-Age=0');
      if (callback) {
        callback();
      }
    };

    req.session = sessionData;
    next();
  };
};
