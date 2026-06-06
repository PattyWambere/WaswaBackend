import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { checkMaintenanceMode } from '../middleware/maintenanceMiddleware.js';
import * as userCtrl from '../controllers/userController.js';

const router = express.Router();

// Apply auth middleware and maintenance check to all user routes
router.use(protect);
router.use(checkMaintenanceMode);

router.get('/balances', userCtrl.getMyBalances);
router.get('/config', userCtrl.getAssetConfig);
router.get('/history', userCtrl.getMyTransactionHistory);

router.post('/deposit', userCtrl.submitDeposit);
router.post('/withdraw', userCtrl.requestWithdrawal);

export default router;
