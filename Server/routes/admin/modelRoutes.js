const express = require('express');
const multer = require('multer');
const { createTwoDModel, getAllTwoDModels, deleteTwoDModel } = require('../../controllers/modelController');

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/', upload.fields([
  { name: 'frontImage', maxCount: 1 },
  { name: 'frontMask', maxCount: 1 },
  { name: 'frontOverlay', maxCount: 1 }
]), createTwoDModel);

router.get('/', getAllTwoDModels);
router.delete('/:id', deleteTwoDModel);

module.exports = router;
