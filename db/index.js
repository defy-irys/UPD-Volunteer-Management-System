const { Pool } = require('pg');
const debug = require('debug')('up-pahinungod:db');

// Create a new pool using the DATABASE_URL environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // needed for Render/Postgres SSL
  },
  max: 20,          // max connections in the pool
  idleTimeoutMillis: 30000, // close idle clients after 30s
  connectionTimeoutMillis: 2000, // fail if connection takes longer than 2s
});

// Test the connection immediately
(async () => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL connected successfully!');
    client.release();
  } catch (err) {
    console.error('❌ Failed to connect to PostgreSQL:', err);
    process.exit(1); // exit process if DB is unreachable
  }
})();

// Optional helper function to run queries with error handling
async function query(text, params) {
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (err) {
    console.error('DB Query Error:', { text, params, err });
    throw err; // rethrow to handle in controllers/models
  }
}

// Export both the pool and helper query function
module.exports = {
  pool,
  query,
};