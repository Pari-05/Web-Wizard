const db = require('../config/db');       // Firebase connection
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || 'mysecretkey';

// Signup
const signup = async (req, res) => {
  const { email, password } = req.body;
  try {
    const userRef = db.collection('users').doc(email);
    const doc = await userRef.get();
    if (doc.exists) return res.status(400).json({ message: 'User already exists' });

    await userRef.set({ email, password });
    res.json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Login
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const userRef = db.collection('users').doc(email);
    const doc = await userRef.get();
    if (!doc.exists) return res.status(400).json({ message: 'User not found' });

    const user = doc.data();
    if (user.password !== password) return res.status(400).json({ message: 'Wrong password' });

    const token = jwt.sign({ id: email }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { signup, login };
