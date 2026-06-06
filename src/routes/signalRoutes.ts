import { Router } from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { createSignal, getAdminSignals } from '../controllers/signalController.js';

const router = Router();

// Admin Routes
router.post('/', protect, admin, createSignal);
router.get('/admin', protect, admin, getAdminSignals);

export default router;
