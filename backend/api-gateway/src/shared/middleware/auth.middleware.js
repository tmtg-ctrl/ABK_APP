const supabase = require('../../config/supabase');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token =
      authHeader.replace(/^Bearer\s+/i, '') ||
      req.headers['x-access-token'] ||
      req.body?.access_token ||
      req.query?.access_token;

    if (!token) {
      return res.status(401).json({
        error: 'Authorization token required',
        acceptedTokenLocations: [
          'Authorization: Bearer <access_token>',
          'x-access-token: <access_token>',
          'body.access_token',
          'query.access_token'
        ]
      });
    }

    const {
      data: { user },
      error
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

const requireAdmin = (req, res, next) => {
  const role = req.user?.app_metadata?.role;

  if (role !== 'admin') {
    return res.status(403).json({ error: 'Admin permission required' });
  }

  next();
};

module.exports = {
  authenticate,
  requireAdmin
};
