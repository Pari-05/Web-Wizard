const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const { createNote, getNotes, updateNote, deleteNote } = require('../controllers/notesController');

router.post('/', verifyToken, createNote);
router.get('/', verifyToken, getNotes);
router.put('/:id', verifyToken, updateNote);
router.delete('/:id', verifyToken, deleteNote);

module.exports = router;
