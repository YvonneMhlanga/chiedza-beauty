// Populate the demo salons/styles/stylists when the database is empty.
// Runs on every server start so the app still has browsable content on hosts
// with an ephemeral disk (e.g. Render free tier). Never touches user data.

const db = require('./db');
const { salons, styles, stylists } = require('./data/seed-data');

module.exports = function seedIfEmpty() {
  db.get('SELECT COUNT(*) AS n FROM salons', (err, row) => {
    if (err) {
      console.error('seedIfEmpty check failed:', err.message);
      return;
    }
    if (row && row.n > 0) return; // already has content

    console.log('📦 Empty database — seeding demo salons/styles/stylists…');

    salons.forEach((s) =>
      db.run(
        `INSERT OR IGNORE INTO salons
         (id, userId, name, location, neighborhood, phone, services, priceRange, rating, reviews, imageUrl)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [s.id, null, s.name, s.location, s.neighborhood, s.phone, JSON.stringify(s.services), s.priceRange, s.rating, s.reviews, s.imageUrl]
      )
    );

    styles.forEach((s) =>
      db.run(
        `INSERT OR IGNORE INTO styles
         (id, title, imageUrl, stylistName, salonId, styleType, product, duration, price, technique, ageGroup)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [s.id, s.title, s.imageUrl, s.stylistName, s.salonId, s.styleType, s.product, s.duration, s.price, s.technique, s.ageGroup]
      )
    );

    stylists.forEach((s) =>
      db.run(
        `INSERT OR IGNORE INTO stylists
         (id, name, salonId, specialty, experience, startingPrice, phone, rating, reviews, bio, imageUrl)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [s.id, s.name, s.salonId, s.specialty, s.experience, s.startingPrice, s.phone, s.rating, s.reviews, s.bio, s.imageUrl],
        (e) => e && console.error('seed stylist failed:', e.message)
      )
    );
  });
};
