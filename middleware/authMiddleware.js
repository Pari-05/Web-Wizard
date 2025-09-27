const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || 'mysecretkey'; // put your secret in .env

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  const actualToken = token.split(' ')[1]; // remove "Bearer"
  try {
    const decoded = jwt.verify(actualToken, SECRET_KEY);
    req.user = decoded; // attach user info to request
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = verifyToken;
