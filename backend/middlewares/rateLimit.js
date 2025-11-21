/**
 * Middleware para rate limiting básico
 * Protege los endpoints de abuso
 */
const rateLimits = new Map();

const rateLimit = (windowMs = 60000, maxRequests = 100) => {
  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!rateLimits.has(ip)) {
      rateLimits.set(ip, []);
    }

    const requests = rateLimits.get(ip).filter(time => time > windowStart);
    rateLimits.set(ip, requests);

    if (requests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Demasiadas peticiones',
        retryAfter: Math.ceil((requests[0] + windowMs - now) / 1000)
      });
    }

    requests.push(now);
    next();
  };
};

module.exports = rateLimit;