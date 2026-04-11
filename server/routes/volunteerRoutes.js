const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { sendResponse } = require('../utils/response');
const db = require('../db');

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { limit = 10, offset = 0, search = '', program = '', year = '' } = req.query;
    
    let query = 'SELECT * FROM volunteers WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (search) {
      query += ` AND (full_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR mobile ILIKE $${paramIndex} OR uid ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    if (program) {
      query += ` AND program = $${paramIndex}`;
      params.push(program);
      paramIndex++;
    }
    
    if (year) {
      query += ` AND year_joined = $${paramIndex}`;
      params.push(year);
      paramIndex++;
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    
    let countQuery = 'SELECT COUNT(*) as total FROM volunteers WHERE 1=1';
    const countParams = [];
    let countIndex = 1;
    
    if (search) {
      countQuery += ` AND (full_name ILIKE $${countIndex} OR email ILIKE $${countIndex} OR mobile ILIKE $${countIndex} OR uid ILIKE $${countIndex})`;
      countParams.push(`%${search}%`);
      countIndex++;
    }
    
    if (program) {
      countQuery += ` AND program = $${countIndex}`;
      countParams.push(program);
      countIndex++;
    }
    
    if (year) {
      countQuery += ` AND year_joined = $${countIndex}`;
      countParams.push(year);
      countIndex++;
    }
    
    const countResult = await db.query(countQuery, countParams);
    
    sendResponse(res, {
      success: true,
      data: {
        rows: result.rows,
        total: parseInt(countResult.rows[0].total)
      },
      message: 'Volunteers retrieved successfully'
    });
  } catch (err) {
    console.error("Error fetching volunteers:", err);
    next(err);
  }
});

router.get('/stats', requireAuth, async (req, res, next) => {
  try {
    const stats = await db.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as this_month,
        COUNT(CASE WHEN program = 'Tutorial Service Program' THEN 1 END) as tutorial,
        COUNT(CASE WHEN program = 'Health Training Program' THEN 1 END) as health,
        COUNT(CASE WHEN program = 'Disaster Preparedness & Risk Management Program' THEN 1 END) as disaster
      FROM volunteers
    `);
    
    sendResponse(res, {
      success: true,
      data: stats.rows[0],
      message: 'Stats retrieved successfully'
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    next(err);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const checkResult = await db.query('SELECT * FROM volunteers WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return sendResponse(res, { success: false, data: null, message: 'Volunteer not found' }, 404);
    }
    
    await db.query('DELETE FROM volunteers WHERE id = $1', [id]);
    
    sendResponse(res, { success: true, data: null, message: 'Volunteer deleted successfully' });
  } catch (err) {
    console.error("Delete error:", err);
    next(err);
  }
});

module.exports = router;