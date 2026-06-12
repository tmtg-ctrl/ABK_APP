const express = require('express');
const router = express.Router();
const authController = require('../auth/auth.controller');
const { authenticate, requireAdmin } = require('../../shared/middleware/auth.middleware');

router.post('/create-user', authenticate, requireAdmin, authController.register);
router.post('/register', authenticate, requireAdmin, authController.register);
router.get('/employees', authenticate, authController.listEmployees);
router.get('/directory', authenticate, authController.listDirectory);
router.post('/login', authController.login);
router.post('/login-user', authController.login);
router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);

module.exports = router;
