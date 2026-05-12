const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createCollection, updateCollection, deleteCollection, getCollections } = require('../../controllers/collectionController');
const { protectAdmin } = require('../../middleware/authMiddleware');

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get('/', protectAdmin, getCollections);
router.post('/', protectAdmin, upload.single('logo'), createCollection);
router.put('/:id', protectAdmin, upload.single('logo'), updateCollection);
router.delete('/:id', protectAdmin, deleteCollection);

module.exports = router;
