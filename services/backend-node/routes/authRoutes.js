const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Define the signup route
router.post('/signup', authController.signup);

module.exports = router;
