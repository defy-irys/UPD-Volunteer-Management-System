const { pool } = require('../db');

function buildFilters({ search, program, year }) {
  const where = [];
  const values = [];

  if (search) {
    values.push(`%${search}%`);
    values.push(`%${search}%`);
    values.push(`%${search}%`);
    values.push(`%${search}%`);
    where.push(`(uid ILIKE $1 OR full_name ILIKE $2 OR email ILIKE $3 OR mobile ILIKE $4)`);
  }

  if (program) {
    values.push(program);
    where.push(`program = $${values.length}`);
  }

  if (year) {
    values.push(Number(year));
    where.push(`year_joined = $${values.length}`);
  }

  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  return { clause, values };
}

async function listVolunteers({ search, program, year, limit = 10, offset = 0 }) {
  const { clause, values } = buildFilters({ search, program, year });
  const countRes = await pool.query(`SELECT COUNT(*) FROM volunteers ${clause}`, values);
  const total = Number(countRes.rows[0].count || 0);

  const queryValues = [...values, limit, offset];
  const rowsRes = await pool.query(
    `SELECT * FROM volunteers ${clause} ORDER BY created_at DESC LIMIT $${queryValues.length - 1} OFFSET $${queryValues.length}`,
    queryValues
  );

  return { rows: rowsRes.rows, total };
}

async function findByEmail(email) {
  const { rows } = await pool.query('SELECT id, email FROM volunteers WHERE lower(email) = lower($1) LIMIT 1', [email]);
  return rows[0] || null;
}

async function createVolunteer(payload) {
  const {
    uid,
    program,
    full_name,
    mobile,
    email,
    alumnus_up,
    connected_pgh,
    occupation,
    year_joined,
    prc_license,
    department_office,
    college,
    course,
    year_level
  } = payload;

  const { rows } = await pool.query(
    `INSERT INTO volunteers
      (uid, program, full_name, mobile, email, alumnus_up, connected_pgh, occupation, year_joined,
       prc_license, department_office, college, course, year_level)
     VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING *`,
    [
      uid,
      program,
      full_name,
      mobile,
      email,
      alumnus_up,
      connected_pgh,
      occupation,
      year_joined,
      prc_license || null,
      department_office || null,
      college || null,
      course || null,
      year_level || null
    ]
  );

  return rows[0];
}

async function getStats(programs) {
  const res = await pool.query(
    `SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE date_trunc('month', created_at) = date_trunc('month', now()))::int AS this_month,
      COUNT(*) FILTER (WHERE program = $1)::int AS tutorial,
      COUNT(*) FILTER (WHERE program = $2)::int AS health,
      COUNT(*) FILTER (WHERE program = $3)::int AS disaster
     FROM volunteers`,
    programs
  );
  return res.rows[0];
}

module.exports = {
  listVolunteers,
  findByEmail,
  createVolunteer,
  getStats
};
