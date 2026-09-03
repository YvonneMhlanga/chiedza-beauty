/**
 * One database module, two drivers:
 *   - Postgres  when DATABASE_URL is set (production / Neon)
 *   - SQLite    otherwise (local dev, zero setup)
 *
 * Both expose the same tiny callback API used across the routes:
 *   db.run(sql, params?, cb?)   -> cb(err)               (this.changes on Postgres)
 *   db.get(sql, params?, cb)    -> cb(err, row)
 *   db.all(sql, params?, cb)    -> cb(err, rows)
 *   db.init()  -> Promise       (create tables + run migrations)
 *   db.dialect -> 'pg' | 'sqlite'
 *
 * Queries are written once with `?` placeholders and camelCase columns. On
 * Postgres, `?` is rewritten to `$1..$n` and result keys (which Postgres folds
 * to lowercase) are mapped back to the camelCase names the routes expect.
 */

const usePg = !!process.env.DATABASE_URL;

// ── shared schema ──────────────────────────────────────────────────────────
function schemaStatements(d) {
  const TS = d === 'pg' ? 'TIMESTAMPTZ DEFAULT NOW()' : 'DATETIME DEFAULT CURRENT_TIMESTAMP';
  const TS_NULL = d === 'pg' ? 'TIMESTAMPTZ' : 'DATETIME';
  return [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT,
      location TEXT,
      bio TEXT,
      profileImage TEXT,
      userType TEXT DEFAULT 'client',
      createdAt ${TS},
      updatedAt ${TS}
    )`,
    `CREATE TABLE IF NOT EXISTS salons (
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
      createdAt ${TS}
    )`,
    `CREATE TABLE IF NOT EXISTS styles (
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
      createdAt ${TS}
    )`,
    `CREATE TABLE IF NOT EXISTS stylists (
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
      createdAt ${TS}
    )`,
    `CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      salonId TEXT NOT NULL,
      date TEXT,
      time TEXT,
      service TEXT,
      status TEXT DEFAULT 'pending',
      createdAt ${TS}
    )`,
    `CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      salonId TEXT NOT NULL,
      userId TEXT NOT NULL,
      rating REAL,
      comment TEXT,
      createdAt ${TS}
    )`,
    `CREATE TABLE IF NOT EXISTS portfolio (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      imageUrl TEXT NOT NULL,
      createdAt ${TS}
    )`,
    `CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      fromUserId TEXT NOT NULL,
      toUserId TEXT NOT NULL,
      body TEXT NOT NULL,
      readAt ${TS_NULL},
      createdAt ${TS}
    )`,
    // Binary image storage, used when there is no external image host configured.
    `CREATE TABLE IF NOT EXISTS uploads (
      id TEXT PRIMARY KEY,
      data ${d === 'pg' ? 'BYTEA' : 'BLOB'} NOT NULL,
      mime TEXT,
      createdAt ${TS}
    )`,
    // Braider availability — one row per bookable time slot.
    `CREATE TABLE IF NOT EXISTS availability (
      id TEXT PRIMARY KEY,
      braiderId TEXT NOT NULL,
      date TEXT NOT NULL,
      startTime TEXT NOT NULL,
      endTime TEXT,
      booked INTEGER DEFAULT 0,
      bookingId TEXT,
      createdAt ${TS}
    )`,
  ];
}

// Columns added after the first release.
function migrationStatements(d) {
  const IFNOT = d === 'pg' ? 'IF NOT EXISTS ' : '';
  const BIG = d === 'pg' ? 'BIGINT' : 'INTEGER';
  return [
    `ALTER TABLE users ADD COLUMN ${IFNOT}specialty TEXT`,
    `ALTER TABLE users ADD COLUMN ${IFNOT}experience TEXT`,
    `ALTER TABLE users ADD COLUMN ${IFNOT}startingPrice TEXT`,
    `ALTER TABLE users ADD COLUMN ${IFNOT}available INTEGER DEFAULT 1`,
    `ALTER TABLE users ADD COLUMN ${IFNOT}resetToken TEXT`,
    `ALTER TABLE users ADD COLUMN ${IFNOT}resetExpires ${BIG}`,
    // Client + braider registration details (added for the HIT/Belvedere pilot)
    `ALTER TABLE users ADD COLUMN ${IFNOT}username TEXT`,
    `ALTER TABLE users ADD COLUMN ${IFNOT}dateOfBirth TEXT`,
    `ALTER TABLE users ADD COLUMN ${IFNOT}occupation TEXT`,
    `ALTER TABLE users ADD COLUMN ${IFNOT}hairType TEXT`,
    `ALTER TABLE users ADD COLUMN ${IFNOT}hairProducts TEXT`,
    `ALTER TABLE users ADD COLUMN ${IFNOT}serviceTime TEXT`,
    `ALTER TABLE users ADD COLUMN ${IFNOT}isStudent INTEGER DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN ${IFNOT}isAdmin INTEGER DEFAULT 0`,
    `ALTER TABLE bookings ADD COLUMN ${IFNOT}braiderId TEXT`,
    `ALTER TABLE bookings ADD COLUMN ${IFNOT}styleId TEXT`,
    `ALTER TABLE bookings ADD COLUMN ${IFNOT}styleTitle TEXT`,
    `ALTER TABLE bookings ADD COLUMN ${IFNOT}note TEXT`,
    `ALTER TABLE bookings ADD COLUMN ${IFNOT}refImage TEXT`,
    `ALTER TABLE bookings ADD COLUMN ${IFNOT}slotId TEXT`,
  ];
}

let db;

if (usePg) {
  // ── Postgres driver ─────────────────────────────────────────────────────
  const { Pool } = require('pg');
  const cs = process.env.DATABASE_URL;
  // Hosted Postgres (Neon, Supabase, Render, …) all require SSL. Only skip it
  // for an explicit local connection or when PGSSL=disable.
  const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(cs);
  const needsSsl = !isLocal && process.env.PGSSL !== 'disable';
  const pool = new Pool({
    connectionString: cs,
    ssl: needsSsl ? { rejectUnauthorized: false } : false,
    max: 5,
  });

  const toPg = (sql) => {
    let i = 0;
    return sql.replace(/\?/g, () => `$${++i}`);
  };

  // Postgres folds unquoted identifiers to lowercase; map results back.
  const CAMEL = [
    'userId', 'profileImage', 'userType', 'createdAt', 'updatedAt', 'priceRange',
    'imageUrl', 'stylistName', 'salonId', 'styleType', 'ageGroup', 'startingPrice',
    'fromUserId', 'toUserId', 'readAt', 'resetToken', 'resetExpires', 'braiderId',
    'styleId', 'styleTitle', 'refImage', 'clientName', 'clientPhone', 'clientImage',
    'braiderName', 'braiderPhone', 'braiderImage', 'salonName',
    'dateOfBirth', 'hairType', 'hairProducts', 'serviceTime', 'isStudent', 'isAdmin',
    'startTime', 'endTime', 'bookingId', 'slotId',
  ];
  const LOWER_TO_CAMEL = Object.fromEntries(CAMEL.map((c) => [c.toLowerCase(), c]));
  const remap = (row) => {
    if (!row || typeof row !== 'object') return row;
    const out = {};
    for (const k of Object.keys(row)) out[LOWER_TO_CAMEL[k] || k] = row[k];
    return out;
  };

  const args = (params, cb) =>
    typeof params === 'function' ? [[], params] : [params || [], cb];

  db = {
    dialect: 'pg',
    run(sql, params, cb) {
      const [p, c] = args(params, cb);
      pool.query(toPg(sql), p)
        .then((r) => c && c.call({ changes: r.rowCount }, null))
        .catch((e) => (c ? c(e) : console.error('DB run error:', e.message, '|', sql)));
    },
    get(sql, params, cb) {
      const [p, c] = args(params, cb);
      pool.query(toPg(sql), p)
        .then((r) => c && c(null, remap(r.rows[0])))
        .catch((e) => c && c(e));
    },
    all(sql, params, cb) {
      const [p, c] = args(params, cb);
      pool.query(toPg(sql), p)
        .then((r) => c && c(null, r.rows.map(remap)))
        .catch((e) => c && c(e));
    },
    close(cb) {
      pool.end().then(() => cb && cb()).catch(() => cb && cb());
    },
    async init() {
      for (const s of schemaStatements('pg')) await pool.query(s);
      for (const s of migrationStatements('pg')) {
        try {
          await pool.query(s);
        } catch (e) {
          if (!/already exists/i.test(e.message)) console.error('Migration:', e.message);
        }
      }
      console.log('✅ Connected to Postgres');
    },
  };
} else {
  // ── SQLite driver ──────────────────────────────────────────────────────
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');
  const sdb = new sqlite3.Database(path.join(__dirname, 'chiedza.db'), (err) => {
    if (err) console.error('Database connection error:', err);
  });

  const args = (params, cb) =>
    typeof params === 'function' ? [[], params] : [params || [], cb];

  db = {
    dialect: 'sqlite',
    run(sql, params, cb) {
      const [p, c] = args(params, cb);
      sdb.run(sql, p, c);
    },
    get(sql, params, cb) {
      const [p, c] = args(params, cb);
      sdb.get(sql, p, c);
    },
    all(sql, params, cb) {
      const [p, c] = args(params, cb);
      sdb.all(sql, p, c);
    },
    close(cb) {
      sdb.close(cb);
    },
    init() {
      return new Promise((resolve) => {
        sdb.serialize(() => {
          schemaStatements('sqlite').forEach((s) => sdb.run(s));
          migrationStatements('sqlite').forEach((s) =>
            sdb.run(s, (err) => {
              if (err && !/duplicate column name/i.test(err.message)) {
                console.error('Migration error:', err.message);
              }
            })
          );
          sdb.get('SELECT 1', () => {
            console.log('✅ Connected to SQLite database');
            resolve();
          });
        });
      });
    },
  };
}

module.exports = db;
