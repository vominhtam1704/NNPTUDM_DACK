// ============================================
// AUTH.JS - AUTHENTICATION MIDDLEWARE
// ============================================
const { verifyToken } = require('../utils/jwt');
const { formatError } = require('../utils/response');

/**
 * Verify JWT token middleware
 */
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

    if (!token) {
      return res.status(401).json(formatError('No token provided', 401));
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json(formatError('Invalid or expired token', 403));
  }
};

/**
 * Role-based access control
 */
const authorizeRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(formatError('Unauthorized', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json(
        formatError('Forbidden: insufficient permissions', 403)
      );
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRole
};
