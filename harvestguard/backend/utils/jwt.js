// JWT token utility
const jwt = require('jsonwebtoken');

// Default secret (should be overridden by environment variable)
const SECRET = process.env.JWT_SECRET || 'harvestguard-demo-secret-2025';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate JWT token for user
 * @param {object} user - User object (id, email)
 * @returns {string} - JWT token
 */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    SECRET,
    { expiresIn: EXPIRES_IN }
  );
}

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {object|null} - Decoded payload or null if invalid
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Express middleware to authenticate requests
 * DISABLED: No authentication required - auto-login as demo user
 */
function authMiddleware(req, res, next) {
  // Auto-set demo user for all requests
  req.user = {
    id: 'demo-farmer-001',
    email: 'demo@harvestguard.com'
  };
  next();
}

module.exports = { generateToken, verifyToken, authMiddleware };

