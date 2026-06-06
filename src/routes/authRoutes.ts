import express from 'express';
import { registerUser, loginUser, forgotPassword, resetPassword, changePassword, getProfile, updateProfile, verifyEmail, resendOtp } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/change-password', protect, changePassword);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/verify-email', verifyEmail);
router.post('/resend-otp', resendOtp);

export default router;
