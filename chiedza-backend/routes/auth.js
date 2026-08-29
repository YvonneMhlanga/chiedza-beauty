const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { OAuth2Client } = require('google-auth-library');
const db = require('../db');

// Set GOOGLE_CLIENT_ID in .env to pin it; otherwise we trust the client id the
// frontend was built with (NEXT_PUBLIC_GOOGLE_CLIENT_ID). Either way the ID token
// is still cryptographically verified against Google and its `aud` claim is checked.
const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || '').trim();
const googleClient = new OAuth2Client();

function issueToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, userType: user.userType },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Register
router.post('/register', (req, res) => {
  const { name, password } = req.body;
  const email = (req.body.email || '').trim().toLowerCase();
  // "client" = someone who wants to get their hair done, "braider" = a professional
  const userType = req.body.userType === 'braider' ? 'braider' : 'client';

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields required' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const userId = uuidv4();

  db.run(
    'INSERT INTO users (id, name, email, password, userType) VALUES (?, ?, ?, ?, ?)',
    [userId, name, email, hashedPassword, userType],
    (err) => {
      if (err) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      const token = jwt.sign({ userId, email, userType }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.json({
        message: 'User registered successfully',
        token,
        user: { id: userId, name, email, userType },
      });
    }
  );
});

// Login
router.post('/login', (req, res) => {
  const { password } = req.body;
  const email = (req.body.email || '').trim().toLowerCase();

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, userType: user.userType },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        userType: user.userType,
        profileImage: user.profileImage || null,
      }
    });
  });
});

// Sign in / sign up with a Google ID token (from Google Identity Services)
router.post('/google', async (req, res) => {
  const { credential, clientId } = req.body;
  const userType = req.body.userType === 'braider' ? 'braider' : 'client';
  if (!credential) {
    return res.status(400).json({ error: 'Missing Google credential' });
  }

  const audience = GOOGLE_CLIENT_ID || (typeof clientId === 'string' ? clientId.trim() : '');
  if (!audience) {
    return res.status(501).json({
      error: 'Google sign-in is not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID (frontend) or GOOGLE_CLIENT_ID (backend).',
    });
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ error: 'Invalid Google credential' });
  }

  const email = (payload.email || '').trim().toLowerCase();
  const name = payload.name || (email ? email.split('@')[0] : 'User');
  const picture = payload.picture || null;
  if (!email) {
    return res.status(400).json({ error: 'Google account has no email' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, existing) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (existing) {
      const respond = (profileImage) =>
        res.json({
          message: 'Login successful',
          token: issueToken(existing),
          user: {
            id: existing.id,
            name: existing.name,
            email: existing.email,
            phone: existing.phone,
            location: existing.location,
            userType: existing.userType,
            profileImage,
          },
        });

      // Only fill the photo from Google if they haven't set one themselves.
      if (!existing.profileImage && picture) {
        return db.run('UPDATE users SET profileImage = ? WHERE id = ?', [picture, existing.id], () =>
          respond(picture)
        );
      }
      return respond(existing.profileImage || null);
    }

    // First time with Google -> create the account. No password (Google-only login).
    const userId = uuidv4();
    const randomHash = bcrypt.hashSync(uuidv4(), 10);
    db.run(
      'INSERT INTO users (id, name, email, password, userType, profileImage) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, name, email, randomHash, userType, picture],
      (insertErr) => {
        if (insertErr) {
          return res.status(500).json({ error: 'Could not create account' });
        }
        const user = { id: userId, name, email, userType, profileImage: picture };
        res.json({ message: 'User registered successfully', token: issueToken(user), user });
      }
    );
  });
});

// Forgot password — issue a reset token.
// There is no mail server wired up, so the token/link is returned in the
// response (and logged) for the user to use directly. In production this would
// instead be emailed and the response would stay generic.
router.post('/forgot', (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'Email is required' });

  db.get('SELECT id, email FROM users WHERE lower(email) = ?', [email], (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) {
      // Don't reveal whether the email exists.
      return res.json({ message: 'If that account exists, a reset link has been created.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 60 * 60 * 1000; // 1 hour
    db.run(
      'UPDATE users SET resetToken = ?, resetExpires = ? WHERE id = ?',
      [token, expires, user.id],
      (uErr) => {
        if (uErr) return res.status(500).json({ error: 'Could not start password reset' });
        console.log(`\n🔑 Password reset for ${user.email}:  /auth/reset?token=${token}\n`);
        res.json({
          message: 'Reset link created.',
          // dev convenience — no email service configured
          resetToken: token,
          resetPath: `/auth/reset?token=${token}`,
        });
      }
    );
  });
});

// Reset password using the token from /forgot
router.post('/reset', (req, res) => {
  const { token } = req.body;
  const password = req.body.password || '';
  if (!token || !password) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  db.get('SELECT id, resetExpires FROM users WHERE resetToken = ?', [token], (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user || !user.resetExpires || user.resetExpires < Date.now()) {
      return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
    }
    const hashed = bcrypt.hashSync(password, 10);
    db.run(
      'UPDATE users SET password = ?, resetToken = NULL, resetExpires = NULL, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [hashed, user.id],
      (uErr) => {
        if (uErr) return res.status(500).json({ error: 'Could not reset password' });
        res.json({ message: 'Password updated. You can now sign in.' });
      }
    );
  });
});

// Get current user
router.get('/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    db.get('SELECT id, name, email, phone, location, bio, profileImage, userType, specialty, experience, startingPrice, available FROM users WHERE id = ?', [decoded.userId], (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Update profile
router.put('/profile', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Only update the fields that were actually sent, so a client saving their
    // form never wipes braider-only columns and vice versa.
    const allowed = ['name', 'phone', 'location', 'bio', 'specialty', 'experience', 'startingPrice', 'available'];
    const sets = [];
    const vals = [];
    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        sets.push(`${field} = ?`);
        vals.push(field === 'available' ? (req.body[field] ? 1 : 0) : req.body[field]);
      }
    }
    if (!sets.length) {
      return res.json({ message: 'Nothing to update' });
    }
    sets.push('updatedAt = CURRENT_TIMESTAMP');
    vals.push(decoded.userId);

    db.run(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, vals, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Update failed' });
      }
      res.json({ message: 'Profile updated successfully' });
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;