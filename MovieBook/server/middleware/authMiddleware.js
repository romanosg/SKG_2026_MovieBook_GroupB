
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Authentication required. Please provide a Bearer token.',
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      message: 'Token is missing.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.userId) {
      return res.status(401).json({
        message: 'Invalid token payload.',
      });
    }

    req.user = {
      userId: decoded.userId,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired token.',
    });
  }
}

module.exports = authMiddleware;
