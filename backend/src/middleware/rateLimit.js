const { publicRateLimit, publicRateWindowMinutes } = require('../config');

const buckets = new Map();

function rateLimit({ limit = publicRateLimit, windowMinutes = publicRateWindowMinutes } = {}) {
  const windowMs = windowMinutes * 60 * 1000;
  return (req, res, next) => {
    const now = Date.now();
    const key = `${req.ip}:${req.baseUrl}:${req.route?.path || req.path}`;
    const current = buckets.get(key);
    const bucket = !current || current.resetAt <= now ? { count: 0, resetAt: now + windowMs } : current;
    bucket.count += 1;
    buckets.set(key, bucket);
    res.set('X-RateLimit-Limit', String(limit));
    res.set('X-RateLimit-Remaining', String(Math.max(0, limit - bucket.count)));
    res.set('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));
    if (bucket.count > limit) {
      res.set('Retry-After', String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))));
      return res.status(429).json({ detail: 'RATE_LIMIT_EXCEEDED' });
    }
    return next();
  };
}

module.exports = { rateLimit };
