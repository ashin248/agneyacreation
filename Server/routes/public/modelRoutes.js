const express = require('express');
const { getAllTwoDModels } = require('../../controllers/modelController');

const router = express.Router();

router.get('/', getAllTwoDModels);

module.exports = router;
