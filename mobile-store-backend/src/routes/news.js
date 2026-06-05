const express = require('express');
const router = express.Router();
const controller = require('../controllers/newsController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const { newsCreate, newsUpdate } = require('../validators/news.validator');

router.get('/', controller.list);
router.get('/:id', controller.get);

router.post(
  '/',
  requireAuth,
  requireAdmin,
  upload.single('image'),
  validate(newsCreate),
  controller.create,
);
router.post(
  '/upload-image',
  requireAuth,
  requireAdmin,
  upload.single('file'),
  controller.uploadImage,
);
router.put(
  '/:id',
  requireAuth,
  requireAdmin,
  upload.single('image'),
  validate(newsUpdate),
  controller.update,
);
router.delete('/:id', requireAuth, requireAdmin, controller.remove);

module.exports = router;
