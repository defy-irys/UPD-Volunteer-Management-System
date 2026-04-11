const express = require('express');
const { z } = require('zod');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const volunteerController = require('../controllers/volunteerController');

const router = express.Router();

const optionalText = z.string().optional().default('');

const createSchema = z.object({
  program: z.enum([
    'Tutorial Service Program',
    'Health Training Program',
    'Disaster Preparedness & Risk Management Program'
  ]),
  full_name: z.string().min(2, 'Full name is required.'),
  mobile: z.string().regex(/^09\d{9}$/, 'Mobile must match 09XXXXXXXXX.'),
  email: z.string().email('Valid email required.'),
  alumnus_up: z.enum(['Yes', 'No']),
  connected_pgh: z.enum(['Yes', 'No']),
  occupation: z.enum(['Licensed Professional', 'Student', 'Other']),
  year_joined: z.coerce.number().int().min(2018).max(2024),
  prc_license: optionalText,
  department_office: optionalText,
  college: optionalText,
  course: optionalText,
  year_level: optionalText
});

router.get('/', requireAuth, volunteerController.list);
router.get('/stats', requireAuth, volunteerController.stats);
router.post('/', validate(createSchema), volunteerController.create);

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = require('../db');
    
    // Check if volunteer exists
    const checkResult = await db.query('SELECT * FROM volunteers WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return sendResponse(res, { success: false, data: null, message: 'Volunteer not found' }, 404);
    }
    
    // Delete the volunteer
    await db.query('DELETE FROM volunteers WHERE id = $1', [id]);
    
    sendResponse(res, { success: true, data: null, message: 'Volunteer deleted successfully' });
  } catch (err) {
    console.error("Delete error:", err);
    next(err);
  }
});

module.exports = router;
