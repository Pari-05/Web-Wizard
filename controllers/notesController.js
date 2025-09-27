const db = require('../config/db');

// Create a note
const createNote = async (req, res) => {
  const { title, content } = req.body;
  const userId = req.user.id;

  const noteRef = db.collection('notes').doc();
  await noteRef.set({ title, content, userId, createdAt: new Date() });

  res.json({ message: 'Note created', id: noteRef.id });
};

// Get all notes
const getNotes = async (req, res) => {
  const userId = req.user.id;
  const snapshot = await db.collection('notes').where('userId', '==', userId).get();
  const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.json(notes);
};

// Update note
const updateNote = async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const userId = req.user.id;

  const noteRef = db.collection('notes').doc(id);
  const note = await noteRef.get();
  if (!note.exists) return res.status(404).json({ message: 'Note not found' });
  if (note.data().userId !== userId) return res.status(403).json({ message: 'Not allowed' });

  await noteRef.update({ title, content, updatedAt: new Date() });
  res.json({ message: 'Note updated' });
};

// Delete note
const deleteNote = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const noteRef = db.collection('notes').doc(id);
  const note = await noteRef.get();
  if (!note.exists) return res.status(404).json({ message: 'Note not found' });
  if (note.data().userId !== userId) return res.status(403).json({ message: 'Not allowed' });

  await noteRef.delete();
  res.json({ message: 'Note deleted' });
};

module.exports = { createNote, getNotes, updateNote, deleteNote };
