import { Router } from 'express';
import { 
    executeTrade, 
    getPendingSettlements,
    settleManualTrade,
    getMyTrades
} from '../controllers/tradeController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = Router();

// User Routes
router.post('/', protect, executeTrade);
router.get('/my-trades', protect, getMyTrades);

// Admin Routes
router.get('/pending-settlements', protect, admin, getPendingSettlements);
router.post('/settle', protect, admin, settleManualTrade);

export default router;
