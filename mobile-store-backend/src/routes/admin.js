const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// Bulk upload ZIP file: type = phones|brands|news|upcoming
router.post(
  '/bulk/:type',
  requireAuth,
  requireAdmin,
  upload.single('file'),
  adminController.bulkUpload,
);

// Get upload history
router.get(
  '/bulk-history',
  requireAuth,
  requireAdmin,
  adminController.getUploadHistory,
);

// Protected seed endpoint (requires ALLOW_ADMIN_SEED=true)
router.post('/seed', requireAuth, requireAdmin, adminController.runSeed);

module.exports = router;
