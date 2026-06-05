const express = require('express');
const router = express.Router();
const controller = require('../controllers/brandController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { brandCreate, brandUpdate } = require('../validators/brand.validator');

// public
router.get('/', controller.list);

// admin
router.post(
  '/',
  requireAuth,
  requireAdmin,
  validate(brandCreate),
  controller.create
);
router.put(
  '/:id',
  requireAuth,
  requireAdmin,
  validate(brandUpdate),
  controller.update
); // optional but recommended
router.delete('/:id', requireAuth, requireAdmin, controller.remove);

module.exports = router;
