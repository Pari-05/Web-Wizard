require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();

app.use(express.json());
app.use(express.static('public'));


// In-memory “database” (temporary, no Firebase for now)
const users = [];
const notes = [];

const SECRET_KEY = process.env.JWT_SECRET || 'mysecretkey';

// ------------------ AUTH ROUTES ------------------

// Signup
app.post('/auth/signup', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  const exists = users.find(u => u.email === email);
  if (exists) return res.status(400).json({ message: 'User already exists' });

  users.push({ email, password });
  res.json({ message: 'User registered successfully' });
});

// Login
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(400).json({ message: 'User not found' });
  if (user.password !== password) return res.status(400).json({ message: 'Wrong password' });

  const token = jwt.sign({ id: email }, SECRET_KEY, { expiresIn: '1h' });
  res.json({ token });
});

// ------------------ JWT MIDDLEWARE ------------------
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// ------------------ NOTES ROUTES ------------------
app.post('/notes', verifyToken, (req, res) => {
  const { title, content } = req.body;
  const note = { id: notes.length + 1, title, content, userId: req.user.id };
  notes.push(note);
  res.json({ message: 'Note created', note });
});

app.get('/notes', verifyToken, (req, res) => {
  const userNotes = notes.filter(n => n.userId === req.user.id);
  res.json(userNotes);
});

// ------------------ START SERVER ------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
