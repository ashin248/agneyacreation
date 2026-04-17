const express = require('express');
const { loginAdmin } = require('../../controllers/authController');

const router = express.Router();

// POST generic login vectors securely passing encrypted inputs natively
router.post('/login', loginAdmin);



module.exports = router;
