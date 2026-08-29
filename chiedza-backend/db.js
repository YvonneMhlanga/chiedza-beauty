const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'chiedza.db'), (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('✅ Connected to SQLite database');
  }
});

// Create tables
db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT,
      location TEXT,
      bio TEXT,
      profileImage TEXT,
      userType TEXT DEFAULT 'client',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Salons table
  db.run(`
    CREATE TABLE IF NOT EXISTS salons (
      id TEXT PRIMARY KEY,
      userId TEXT,
      name TEXT NOT NULL,
      location TEXT,
      neighborhood TEXT,
      phone TEXT,
      services TEXT,
      priceRange TEXT,
      rating REAL DEFAULT 0,
      reviews INTEGER DEFAULT 0,
      imageUrl TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Styles table
  db.run(`
    CREATE TABLE IF NOT EXISTS styles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      imageUrl TEXT,
      stylistName TEXT,
      salonId TEXT,
      styleType TEXT,
      product TEXT,
      duration TEXT,
      price TEXT,
      technique TEXT,
      ageGroup TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Stylists table
  db.run(`
    CREATE TABLE IF NOT EXISTS stylists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      salonId TEXT,
      specialty TEXT,
      experience TEXT,
      startingPrice TEXT,
      phone TEXT,
      rating REAL DEFAULT 0,
      reviews INTEGER DEFAULT 0,
      bio TEXT,
      imageUrl TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Bookings table
  db.run(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      salonId TEXT NOT NULL,
      date TEXT,
      time TEXT,
      service TEXT,
      status TEXT DEFAULT 'pending',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(salonId) REFERENCES salons(id)
    )
  `);

  // Reviews table
  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      salonId TEXT NOT NULL,
      userId TEXT NOT NULL,
      rating REAL,
      comment TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(salonId) REFERENCES salons(id),
      FOREIGN KEY(userId) REFERENCES users(id)
    )
  `);

  // Portfolio: work photos a braider uploads to their own profile
  db.run(`
    CREATE TABLE IF NOT EXISTS portfolio (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      imageUrl TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id)
    )
  `);

  // Messages: direct chat between a client and a braider on the site
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      fromUserId TEXT NOT NULL,
      toUserId TEXT NOT NULL,
      body TEXT NOT NULL,
      readAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(fromUserId) REFERENCES users(id),
      FOREIGN KEY(toUserId) REFERENCES users(id)
    )
  `);

  // Columns added after the first release — run once, ignore "duplicate column".
  const addColumns = [
    `ALTER TABLE users ADD COLUMN specialty TEXT`,
    `ALTER TABLE users ADD COLUMN experience TEXT`,
    `ALTER TABLE users ADD COLUMN startingPrice TEXT`,
    `ALTER TABLE users ADD COLUMN available INTEGER DEFAULT 1`,
    `ALTER TABLE bookings ADD COLUMN braiderId TEXT`,
    `ALTER TABLE bookings ADD COLUMN styleId TEXT`,
    `ALTER TABLE bookings ADD COLUMN styleTitle TEXT`,
    `ALTER TABLE bookings ADD COLUMN note TEXT`,
    `ALTER TABLE bookings ADD COLUMN refImage TEXT`,
    `ALTER TABLE users ADD COLUMN resetToken TEXT`,
    `ALTER TABLE users ADD COLUMN resetExpires INTEGER`,
  ];
  addColumns.forEach((sql) => {
    db.run(sql, (err) => {
      if (err && !/duplicate column name/i.test(err.message)) {
        console.error('Migration error:', err.message);
      }
    });
  });
});

module.exports = db;
