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

function requireAdmin(req, res, next) {
  db.get('SELECT isAdmin FROM users WHERE id = ?', [req.userId], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!row || !row.isAdmin) return res.status(403).json({ error: 'Admins only' });
    next();
  });
}

// ── Admin: every booking on the platform, flagging ones that need follow-up ──
router.get('/all', requireAuth, requireAdmin, (req, res) => {
  db.all(
    `SELECT b.*, c.name AS clientName, c.phone AS clientPhone,
            br.name AS braiderName, br.phone AS braiderPhone
     FROM bookings b
     LEFT JOIN users c ON c.id = b.userId
     LEFT JOIN users br ON br.id = b.braiderId
     ORDER BY b.createdAt DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      const staleMs = 6 * 60 * 60 * 1000; // pending & older than 6h -> follow up
      const now = Date.now();
      res.json(
        rows.map((b) => ({
          ...b,
          needsFollowUp:
            b.status === 'pending' &&
            b.createdAt &&
            now - new Date(b.createdAt).getTime() > staleMs,
        }))
      );
    }
  );
});

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
  const { braiderId, salonId, styleId, styleTitle, service, note, refImage, slotId } = req.body;
  let { date, time } = req.body;

  if (!braiderId && !salonId) {
    return res.status(400).json({ error: 'A braider or salon is required' });
  }
  if (braiderId === me) {
    return res.status(400).json({ error: 'You cannot book yourself' });
  }

  const finish = (braiderName, slot) => {
    if (slot) {
      date = slot.date;
      time = slot.startTime + (slot.endTime ? `–${slot.endTime}` : '');
    }
    if (!date || (!service && !styleTitle)) {
      return res.status(400).json({ error: 'Pick a time slot and a style or service' });
    }

    const id = uuidv4();
    db.run(
      `INSERT INTO bookings (id, userId, salonId, braiderId, styleId, styleTitle, date, time, service, note, refImage, slotId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, me, salonId || '', braiderId || null, styleId || null, styleTitle || null,
        date, time || '', service || styleTitle || '', note || '', refImage || null, slot ? slot.id : null,
      ],
      (err) => {
        if (err) return res.status(500).json({ error: 'Booking failed' });

        // Reserve the slot so no one else can take it.
        if (slot) {
          db.run('UPDATE availability SET booked = 1, bookingId = ? WHERE id = ?', [id, slot.id]);
        }

        // Notify the braider in chat.
        if (braiderId) {
          const lines = [
            `📅 Booking request: ${service || styleTitle}`,
            `When: ${date}${time ? ` at ${time}` : ''}`,
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

  const withBraider = (braiderName) => {
    if (!slotId) return finish(braiderName, null);
    db.get('SELECT * FROM availability WHERE id = ?', [slotId], (err, slot) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!slot) return res.status(404).json({ error: 'That time slot no longer exists' });
      if (slot.braiderId !== braiderId) return res.status(400).json({ error: 'Slot does not belong to this braider' });
      if (slot.booked) return res.status(409).json({ error: 'That time slot was just taken. Pick another.' });
      finish(braiderName, slot);
    });
  };

  if (!braiderId) return withBraider(null);

  db.get(
    "SELECT name FROM users WHERE id = ? AND userType = 'braider'",
    [braiderId],
    (err, braider) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!braider) return res.status(404).json({ error: 'Braider not found' });
      withBraider(braider.name);
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

      // Free the reserved slot if the booking is declined or cancelled.
      if ((status === 'declined' || status === 'cancelled') && booking.slotId) {
        db.run('UPDATE availability SET booked = 0, bookingId = NULL WHERE id = ?', [booking.slotId]);
      }

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
