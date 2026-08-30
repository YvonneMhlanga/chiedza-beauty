const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

/**
 * Image storage, in priority order:
 *   'cloudinary' — if CLOUDINARY_URL is set
 *   'db'         — binary stored in the `uploads` table (default on Postgres)
 *   'disk'       — local uploads/ folder (default for local SQLite dev)
 * Override with IMAGE_STORE=cloudinary|db|disk.
 */
const imageStore = process.env.CLOUDINARY_URL
  ? 'cloudinary'
  : process.env.IMAGE_STORE || (db.dialect === 'pg' ? 'db' : 'disk');

let cloudinary;
if (imageStore === 'cloudinary') cloudinary = require('cloudinary').v2;

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (imageStore === 'disk' && !fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage =
  imageStore === 'disk'
    ? multer.diskStorage({
        destination: (req, file, cb) => cb(null, UPLOAD_DIR),
        filename: (req, file, cb) => {
          const ext = (path.extname(file.originalname) || '.jpg').toLowerCase();
          cb(null, `${uuidv4()}${ext}`);
        },
      })
    : multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpe?g|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// Persist an uploaded file and resolve to the URL/path stored in the DB.
function persist(file) {
  if (imageStore === 'disk') {
    return Promise.resolve(`/uploads/${file.filename}`);
  }
  if (imageStore === 'cloudinary') {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'chiedza', resource_type: 'image' },
        (err, result) => (err ? reject(err) : resolve(result.secure_url))
      );
      stream.end(file.buffer);
    });
  }
  // 'db' — store the bytes in the uploads table, serve via /api/uploads/file/:id
  return new Promise((resolve, reject) => {
    const id = uuidv4();
    db.run(
      'INSERT INTO uploads (id, data, mime) VALUES (?, ?, ?)',
      [id, file.buffer, file.mimetype],
      (err) => (err ? reject(err) : resolve(`/api/uploads/file/${id}`))
    );
  });
}

// Best-effort delete of a previously stored image (never throws).
function destroyImage(url) {
  if (!url) return;
  if (/^https?:\/\/res\.cloudinary\.com\//.test(url)) {
    const m = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
    if (m && cloudinary) cloudinary.uploader.destroy(m[1]).catch(() => {});
  } else if (url.startsWith('/api/uploads/file/')) {
    db.run('DELETE FROM uploads WHERE id = ?', [url.split('/').pop()], () => {});
  } else if (url.startsWith('/uploads/')) {
    fs.unlink(path.join(UPLOAD_DIR, path.basename(url)), () => {});
  }
}

// ── Public: serve an image stored in the database ─────────────────────────
router.get('/file/:id', (req, res) => {
  db.get('SELECT data, mime FROM uploads WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.set('Content-Type', row.mime || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(Buffer.isBuffer(row.data) ? row.data : Buffer.from(row.data));
  });
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
router.post('/avatar', requireAuth, handleUpload('photo'), async (req, res) => {
  let url;
  try {
    url = await persist(req.file);
  } catch {
    return res.status(500).json({ error: 'Could not upload photo' });
  }
  db.get('SELECT profileImage FROM users WHERE id = ?', [req.userId], (e, row) => {
    db.run(
      'UPDATE users SET profileImage = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [url, req.userId],
      (err) => {
        if (err) return res.status(500).json({ error: 'Could not save photo' });
        if (row && row.profileImage) destroyImage(row.profileImage);
        res.json({ profileImage: url });
      }
    );
  });
});

// Remove the profile photo
router.delete('/avatar', requireAuth, (req, res) => {
  db.get('SELECT profileImage FROM users WHERE id = ?', [req.userId], (e, row) => {
    db.run('UPDATE users SET profileImage = NULL WHERE id = ?', [req.userId], (err) => {
      if (err) return res.status(500).json({ error: 'Could not remove photo' });
      if (row && row.profileImage) destroyImage(row.profileImage);
      res.json({ profileImage: null });
    });
  });
});

// A one-off image (e.g. a booking reference photo) — just stored + returned,
// not attached to any table here; the caller passes the URL on to /api/bookings.
router.post('/reference', requireAuth, handleUpload('photo'), async (req, res) => {
  try {
    const imageUrl = await persist(req.file);
    res.status(201).json({ imageUrl });
  } catch {
    res.status(500).json({ error: 'Could not upload photo' });
  }
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
router.post('/portfolio', requireAuth, handleUpload('photo'), async (req, res) => {
  let url;
  try {
    url = await persist(req.file);
  } catch {
    return res.status(500).json({ error: 'Could not upload photo' });
  }
  const id = uuidv4();
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
      destroyImage(row.imageUrl);
      res.json({ message: 'Deleted' });
    });
  });
});

module.exports = router;
