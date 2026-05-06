const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

// Auth Middleware to decode JWT
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const payloadBuffer = Buffer.from(token.split('.')[1], 'base64');
    const payload = JSON.parse(payloadBuffer.toString());
    req.user = { id: payload.user_id || payload.sub };
    next();
  } catch (e) {
    console.error('JWT Decode Error:', e);
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

router.get('/user-profile/history', requireAuth, profileController.getUserProfileHistory);

module.exports = router;
