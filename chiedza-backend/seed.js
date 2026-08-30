// Seed the database with demo salons, styles and stylists.
// Usage: npm run seed   (from the chiedza-backend/ folder)
// SQLite / local dev only — with Postgres, the server auto-seeds demo content
// on start (see seedIfEmpty.js), so this script is not needed there.

if (process.env.DATABASE_URL) {
  console.error(
    'seed.js is for local SQLite only. With DATABASE_URL set, demo content is ' +
      'seeded automatically when the server starts.'
  );
  process.exit(1);
}

const db = require('./db');
const { salons, styles, stylists } = require('./data/seed-data');

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

async function seed() {
  // Rebuild the demo tables from scratch so the schema always matches seed-data
  // (users/bookings/reviews are left untouched).
  await run('DROP TABLE IF EXISTS salons');
  await run('DROP TABLE IF EXISTS styles');
  await run('DROP TABLE IF EXISTS stylists');

  await run(`
    CREATE TABLE salons (
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
  await run(`
    CREATE TABLE styles (
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
  await run(`
    CREATE TABLE stylists (
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

  for (const s of salons) {
    await run(
      `INSERT INTO salons (id, userId, name, location, neighborhood, phone, services, priceRange, rating, reviews, imageUrl)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [s.id, null, s.name, s.location, s.neighborhood, s.phone, JSON.stringify(s.services), s.priceRange, s.rating, s.reviews, s.imageUrl]
    );
  }

  for (const s of styles) {
    await run(
      `INSERT INTO styles (id, title, imageUrl, stylistName, salonId, styleType, product, duration, price, technique, ageGroup)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [s.id, s.title, s.imageUrl, s.stylistName, s.salonId, s.styleType, s.product, s.duration, s.price, s.technique, s.ageGroup]
    );
  }

  for (const s of stylists) {
    await run(
      `INSERT INTO stylists (id, name, salonId, specialty, experience, startingPrice, phone, rating, reviews, bio, imageUrl)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [s.id, s.name, s.salonId, s.specialty, s.experience, s.startingPrice, s.phone, s.rating, s.reviews, s.bio, s.imageUrl]
    );
  }

  console.log(`✅ Seeded ${salons.length} salons, ${styles.length} styles, ${stylists.length} stylists`);
}

seed()
  .then(() => db.close())
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    db.close();
    process.exit(1);
  });
