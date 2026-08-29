const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || '.jpg').toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpe?g|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// Auth guard — reads the Bearer token and puts userId on req.
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.userId = jwt.verify(token, process.env.JWT_SECRET).userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// multer errors (e.g. file too large / wrong type) -> clean JSON
function handleUpload(field) {
  return (req, res, next) => {
    upload.single(field)(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message });
      if (!req.file) return res.status(400).json({ error: 'No file received' });
      next();
    });
  };
}

// Replace the signed-in user's profile photo
router.post('/avatar', requireAuth, handleUpload('photo'), (req, res) => {
  const url = `/uploads/${req.file.filename}`;
  db.run('UPDATE users SET profileImage = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [url, req.userId], (err) => {
    if (err) return res.status(500).json({ error: 'Could not save photo' });
    res.json({ profileImage: url });
  });
});

// Remove the profile photo
router.delete('/avatar', requireAuth, (req, res) => {
  db.run('UPDATE users SET profileImage = NULL WHERE id = ?', [req.userId], (err) => {
    if (err) return res.status(500).json({ error: 'Could not remove photo' });
    res.json({ profileImage: null });
  });
});

// A one-off image (e.g. a booking reference photo) — just stored + returned,
// not attached to any table here; the caller passes the URL on to /api/bookings.
router.post('/reference', requireAuth, handleUpload('photo'), (req, res) => {
  res.status(201).json({ imageUrl: `/uploads/${req.file.filename}` });
});

// List the signed-in user's portfolio photos
router.get('/portfolio', requireAuth, (req, res) => {
  db.all(
    'SELECT id, imageUrl FROM portfolio WHERE userId = ? ORDER BY createdAt DESC',
    [req.userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(rows);
    }
  );
});

// Add a portfolio photo
router.post('/portfolio', requireAuth, handleUpload('photo'), (req, res) => {
  const id = uuidv4();
  const url = `/uploads/${req.file.filename}`;
  db.run('INSERT INTO portfolio (id, userId, imageUrl) VALUES (?, ?, ?)', [id, req.userId, url], (err) => {
    if (err) return res.status(500).json({ error: 'Could not save photo' });
    res.status(201).json({ id, imageUrl: url });
  });
});

// Delete one of the signed-in user's portfolio photos
router.delete('/portfolio/:id', requireAuth, (req, res) => {
  db.get('SELECT imageUrl FROM portfolio WHERE id = ? AND userId = ?', [req.params.id, req.userId], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!row) return res.status(404).json({ error: 'Photo not found' });
    db.run('DELETE FROM portfolio WHERE id = ?', [req.params.id], (delErr) => {
      if (delErr) return res.status(500).json({ error: 'Could not delete photo' });
      const file = path.join(UPLOAD_DIR, path.basename(row.imageUrl));
      fs.unlink(file, () => {});
      res.json({ message: 'Deleted' });
    });
  });
});

module.exports = router;
