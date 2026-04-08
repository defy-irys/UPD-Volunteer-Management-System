const { AppError } = require('../middleware/errorHandler');
const { sendResponse } = require('../utils/response');
const volunteerModel = require('../models/volunteerModel');

function generateUID() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let r = '';
  for (let i = 0; i < 7; i++) r += chars[Math.floor(Math.random() * chars.length)];
  return `VOL-${r}`;
}

async function list(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 1000);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const search = (req.query.search || '').trim();
    const program = (req.query.program || '').trim();
    const year = (req.query.year || '').trim();

    const result = await volunteerModel.listVolunteers({
      search: search || null,
      program: program || null,
      year: year || null,
      limit,
      offset
    });

    return sendResponse(res, { success: true, data: result, message: 'Volunteers loaded.' });
  } catch (err) {
    return next(err);
  }
}

async function stats(req, res, next) {
  try {
    const programs = [
      'Tutorial Service Program',
      'Health Training Program',
      'Disaster Preparedness & Risk Management Program'
    ];
    const result = await volunteerModel.getStats(programs);
    return sendResponse(res, { success: true, data: result, message: 'Stats loaded.' });
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    const payload = { ...req.body };
    payload.email = String(payload.email || '').toLowerCase();

    if (payload.occupation === 'Licensed Professional') {
      if (!payload.prc_license || !/^\d{1,7}$/.test(payload.prc_license)) {
        return next(new AppError('PRC license must be numeric and up to 7 digits.', 400));
      }
      if (!payload.department_office) {
        return next(new AppError('Department/Office is required.', 400));
      }
    }

    if (payload.occupation === 'Student') {
      if (!payload.college || !payload.course || !payload.year_level) {
        return next(new AppError('Student fields are required.', 400));
      }
    }

    const existing = await volunteerModel.findByEmail(payload.email);
    if (existing) return next(new AppError('Email already registered.', 409));

    const uid = generateUID();
    const created = await volunteerModel.createVolunteer({ ...payload, uid });
    return sendResponse(res, { success: true, data: { uid: created.uid }, message: 'Registration successful.' }, 201);
  } catch (err) {
    if (err && err.code === '23505') {
      return next(new AppError('Duplicate entry detected.', 409));
    }
    return next(err);
  }
}

module.exports = { list, create, stats };
