const jwt = require('jsonwebtoken');

/**
 * Generate a JWT token for a user
 * @param {Object} userId - User ID to include in token
 * @returns {String} - JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

module.exports = generateToken; 