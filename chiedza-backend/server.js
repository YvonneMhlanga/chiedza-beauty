const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads folder if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Root route - friendly landing so "/" does not look like an error
app.get('/', (req, res) => {
  res.json({
    name: 'Chiedza Beauty API',
    status: 'running',
    docs: 'This is a JSON API. Use one of the endpoints below.',
    endpoints: {
      health: 'GET /api/health',
      auth: 'POST /api/auth/register, POST /api/auth/login, POST /api/auth/google, POST /api/auth/forgot, POST /api/auth/reset, GET /api/auth/me, PUT /api/auth/profile',
      users: 'GET /api/users, GET /api/users/:id, DELETE /api/users/:id',
      salons: 'GET /api/salons, GET /api/salons/:id, POST /api/salons',
      styles: 'GET /api/styles, GET /api/styles/:id',
      stylists: 'GET /api/stylists, GET /api/stylists/:id',
      bookings: 'GET /api/bookings, GET /api/bookings/received, POST /api/bookings, PATCH /api/bookings/:id',
      messages: 'GET /api/messages, GET /api/messages/:userId, POST /api/messages, GET /api/messages/unread/count',
    },
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/salons', require('./routes/salons'));
app.use('/api/styles', require('./routes/styles'));
app.use('/api/stylists', require('./routes/stylists'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/messages', require('./routes/messages'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Chiedza Beauty API is running!' });
});

// 404 handler - unknown route
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════╗
║    CHIEDZA BEAUTY API RUNNING    ║
║   PORT: ${PORT}                          
║   URL: http://localhost:${PORT}      
╚════════════════════════════════════╝
  `);
});