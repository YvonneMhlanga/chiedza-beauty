const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

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

// Bookings a braider has RECEIVED (their dashboard)
router.get('/received', requireAuth, (req, res) => {
  db.all(
    `SELECT b.*, u.name AS clientName, u.phone AS clientPhone, u.profileImage AS clientImage
     FROM bookings b
     LEFT JOIN users u ON u.id = b.userId
     WHERE b.braiderId = ?
     ORDER BY b.createdAt DESC`,
    [req.userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(rows);
    }
  );
});

// Bookings the signed-in user has REQUESTED
router.get('/', requireAuth, (req, res) => {
  db.all(
    `SELECT b.*, u.name AS braiderName, u.phone AS braiderPhone, u.profileImage AS braiderImage,
            s.name AS salonName
     FROM bookings b
     LEFT JOIN users u ON u.id = b.braiderId
     LEFT JOIN salons s ON s.id = b.salonId
     WHERE b.userId = ?
     ORDER BY b.createdAt DESC`,
    [req.userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(rows);
    }
  );
});

// Create a booking request
router.post('/', requireAuth, (req, res) => {
  const me = req.userId;
  const { braiderId, salonId, styleId, styleTitle, date, time, service, note, refImage } = req.body;

  if (!date || (!service && !styleTitle)) {
    return res.status(400).json({ error: 'Pick a date and a style or service' });
  }
  if (!braiderId && !salonId) {
    return res.status(400).json({ error: 'A braider or salon is required' });
  }
  if (braiderId === me) {
    return res.status(400).json({ error: 'You cannot book yourself' });
  }

  const finish = (braiderName) => {
    const id = uuidv4();
    db.run(
      `INSERT INTO bookings (id, userId, salonId, braiderId, styleId, styleTitle, date, time, service, note, refImage)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        me,
        salonId || '',
        braiderId || null,
        styleId || null,
        styleTitle || null,
        date,
        time || '',
        service || styleTitle || '',
        note || '',
        refImage || null,
      ],
      (err) => {
        if (err) return res.status(500).json({ error: 'Booking failed' });

        // Drop a message into the chat so the braider is notified right away.
        if (braiderId) {
          const lines = [
            `📅 Booking request: ${service || styleTitle}`,
            `Date: ${date}${time ? ` at ${time}` : ''}`,
          ];
          if (note) lines.push(note);
          if (refImage) lines.push(refImage);
          db.run(
            'INSERT INTO messages (id, fromUserId, toUserId, body) VALUES (?, ?, ?, ?)',
            [uuidv4(), me, braiderId, lines.join('\n')]
          );
        }

        res.status(201).json({ message: 'Booking requested', bookingId: id, braiderName });
      }
    );
  };

  if (!braiderId) return finish(null);

  db.get(
    "SELECT name FROM users WHERE id = ? AND userType = 'braider'",
    [braiderId],
    (err, braider) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!braider) return res.status(404).json({ error: 'Braider not found' });
      finish(braider.name);
    }
  );
});

// Update a booking's status (braider: confirm/decline/complete, client: cancel)
router.patch('/:id', requireAuth, (req, res) => {
  const me = req.userId;
  const { status } = req.body;
  const allowed = ['confirmed', 'declined', 'completed', 'cancelled'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  db.get('SELECT * FROM bookings WHERE id = ?', [req.params.id], (err, booking) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const isClient = booking.userId === me;
    const isBraider = booking.braiderId === me;
    const clientCanSet = status === 'cancelled';
    const braiderCanSet = ['confirmed', 'declined', 'completed'].includes(status);

    if (!((isClient && clientCanSet) || (isBraider && braiderCanSet))) {
      return res.status(403).json({ error: 'Not allowed to change this booking' });
    }

    db.run('UPDATE bookings SET status = ? WHERE id = ?', [status, req.params.id], (uErr) => {
      if (uErr) return res.status(500).json({ error: 'Update failed' });

      // Let the other party know in chat.
      const other = isClient ? booking.braiderId : booking.userId;
      if (other) {
        const verb = { confirmed: 'confirmed', declined: 'declined', completed: 'marked completed', cancelled: 'cancelled' }[status];
        db.run(
          'INSERT INTO messages (id, fromUserId, toUserId, body) VALUES (?, ?, ?, ?)',
          [uuidv4(), me, other, `Booking for ${booking.service || 'your appointment'} on ${booking.date} was ${verb}.`]
        );
      }
      res.json({ message: 'Booking updated', status });
    });
  });
});

module.exports = router;
