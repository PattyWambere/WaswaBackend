import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import * as adminCtrl from '../controllers/adminController.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

// Apply auth & admin middleware to all admin routes
router.use(protect);
router.use(admin);

// System Config
router.get('/assets', adminCtrl.getAssets);
router.post('/assets', adminCtrl.createAsset);
router.put('/assets/:id', adminCtrl.updateAsset);

router.get('/app-settings', adminCtrl.getAppSettings);
router.put('/app-settings', adminCtrl.updateAppSettings);

router.get('/networks', adminCtrl.getNetworks);
router.post('/networks', adminCtrl.createNetwork);
router.put('/networks/:id', adminCtrl.updateNetwork);

router.get('/wallet-settings', adminCtrl.getWalletSettings);
// Wrapper to handle multer errors
const uploadMiddleware = (req: any, res: any, next: any) => {
    upload.single('qrCode')(req, res, (err: any) => {
        if (err) {
            console.error('❌ Multer/Cloudinary Upload Error:', err);
            return res.status(500).json({ error: 'Image upload failed. Check server logs/credentials.' });
        }
        next();
    });
};

router.post('/wallet-settings', uploadMiddleware, adminCtrl.updateWalletSettings);

// Deposits
router.get('/deposits/pending', adminCtrl.getPendingDeposits);
router.get('/deposits/:id', adminCtrl.getDepositById);
router.post('/deposits/:id/approve', adminCtrl.approveDeposit);
router.post('/deposits/:id/reject', adminCtrl.rejectDeposit);

// Withdrawals
router.get('/withdrawals/pending', adminCtrl.getPendingWithdrawals);
router.post('/withdrawals/:id/approve', adminCtrl.approveWithdrawal);
router.post('/withdrawals/:id/deny', adminCtrl.denyWithdrawal);

// balances
router.get('/balances', adminCtrl.getAllBalances);

// referrals
router.get('/referrals', adminCtrl.getReferrals);
router.post('/referrals/:referredUserId/bonus', adminCtrl.addReferralBonus);

export default router;
