const express = require('express');
const {
  createLicense,
  getLicenses,
  updateLicense,
} = require('~/server/controllers/LicenseController');
const { requireJwtAuth } = require('~/server/middleware');

const router = express.Router();

// Middleware to check if user is admin
const checkAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    // Check actual role value 'admin' or 'ADMIN'
    return next();
  }
  return res.status(403).json({ error: 'Admin access required' });
};

router.use(requireJwtAuth);
router.use(checkAdmin);

router.get('/', getLicenses);
router.post('/', createLicense);
router.put('/:id', updateLicense);

module.exports = router;
