const express = require('express');
const router = express.Router();
const db = require('../db');

// Map a `users` row (userType = 'braider') into the shape the frontend expects
// for a stylist card, so real sign-ups appear in the braider directory.
function braiderToStylist(b, portfolio = []) {
  return {
    id: b.id,
    userId: b.id, // present only for real accounts -> enables on-site messaging
    name: b.name,
    salonId: null,
    specialty: b.specialty || 'Braiding',
    experience: b.experience || 'New on Chiedza Beauty',
    startingPrice: b.startingPrice || 'Ask',
    phone: b.phone || '',
    rating: 0,
    reviews: 0,
    bio: b.bio || '',
    imageUrl: b.profileImage || '',
    location: b.location || '',
    available: b.available == null ? 1 : b.available,
    serviceTime: b.serviceTime || '',
    workType: b.workType || '',
    portfolio,
  };
}

const BRAIDER_COLUMNS =
  "SELECT id, name, specialty, experience, startingPrice, phone, bio, profileImage, location, available, serviceTime, workType FROM users WHERE userType = 'braider'";

// Get all stylists: real braider accounts first, then the demo/seed pros
router.get('/', (req, res) => {
  db.all(BRAIDER_COLUMNS, [], (err, braiders) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    const finish = (byUser) => {
      db.all('SELECT * FROM stylists', (e2, seeded) => {
        if (e2) return res.status(500).json({ error: 'Database error' });
        const real = braiders.map((b) => braiderToStylist(b, byUser[b.id] || []));
        const demo = (seeded || []).map((s) => ({ ...s, userId: null, portfolio: [] }));
        res.json([...real, ...demo]);
      });
    };

    if (!braiders.length) return finish({});

    const ids = braiders.map((b) => b.id);
    const ph = ids.map(() => '?').join(',');
    db.all(
      `SELECT userId, imageUrl FROM portfolio WHERE userId IN (${ph}) ORDER BY createdAt DESC`,
      ids,
      (e3, rows) => {
        const byUser = {};
        (rows || []).forEach((r) => {
          (byUser[r.userId] = byUser[r.userId] || []).push(r.imageUrl);
        });
        finish(byUser);
      }
    );
  });
});

// Get one stylist by id — check the seed table first, then real accounts
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM stylists WHERE id = ?', [req.params.id], (err, seeded) => {
    if (seeded) return res.json({ ...seeded, userId: null, portfolio: [] });

    db.get(
      "SELECT id, name, specialty, experience, startingPrice, phone, bio, profileImage, location, available, serviceTime, workType FROM users WHERE id = ? AND userType = 'braider'",
      [req.params.id],
      (e2, b) => {
        if (e2 || !b) return res.status(404).json({ error: 'Stylist not found' });
        db.all(
          'SELECT imageUrl FROM portfolio WHERE userId = ? ORDER BY createdAt DESC',
          [b.id],
          (e3, rows) => {
            res.json(braiderToStylist(b, (rows || []).map((r) => r.imageUrl)));
          }
        );
      }
    );
  });
});

module.exports = router;
