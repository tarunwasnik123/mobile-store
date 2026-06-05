const express = require('express');
const router = express.Router();
const controller = require('../controllers/upcomingPhoneController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const { phoneCreate, phoneUpdate } = require('../validators/phone.validator');

router.get('/', controller.list);
router.get('/:id', controller.get);
router.post(
  '/',
  requireAuth,
  requireAdmin,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 10 },
  ]),
  validate(phoneCreate),
  controller.create,
);
router.put(
  '/:id',
  requireAuth,
  requireAdmin,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 10 },
  ]),
  validate(phoneUpdate),
  controller.update,
);
router.delete('/:id', requireAuth, requireAdmin, controller.remove);

module.exports = router;
