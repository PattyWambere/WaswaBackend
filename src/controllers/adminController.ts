import { Request, Response } from 'express';
import { Asset, Network, AppSettings } from '../models/SystemConfig.js';
import { WalletSettings } from '../models/WalletData.js';
import { Deposit, Withdrawal } from '../models/Transaction.js';
import { Balance } from '../models/WalletData.js';
import mongoose from 'mongoose';
import sendEmail from '../utils/sendEmail.js';
import { createNotification } from '../utils/notificationHelper.js';
import User from '../models/User.js';

// --- App Settings (Maintenance Mode) ---

export const getAppSettings = async (req: Request, res: Response) => {
    try {
        let settings = await AppSettings.findOne({});
        if (!settings) {
            settings = await AppSettings.create({ maintenanceMode: false });
        }
        res.json(settings);
    } catch (error) {
        console.error('❌ Get App Settings Error:', error);
        res.status(500).json({ error: (error as Error).message });
    }
};

export const updateAppSettings = async (req: Request, res: Response) => {
    const { maintenanceMode, maintenanceMessage } = req.body;
    console.log('Update App Settings Request:', { maintenanceMode, maintenanceMessage });
    try {
        const settings = await AppSettings.findOneAndUpdate(
            {},
            {
                $set: {
                    maintenanceMode: maintenanceMode === true || maintenanceMode === 'true',
                    ...(maintenanceMessage !== undefined && { maintenanceMessage }),
                    updatedBy: (req as any).user?.email
                }
            },
            { upsert: true, new: true }
        );
        console.log('✅ App Settings Updated:', settings);
        res.json(settings);
    } catch (error) {
        console.error('❌ Update App Settings Error:', error);
        res.status(500).json({ error: (error as Error).message });
    }
};

// --- System Configuration ---

export const getAssets = async (req: Request, res: Response) => {
    try {
        const assets = await Asset.find({});
        res.json(assets);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const createAsset = async (req: Request, res: Response) => {
    const { symbol, name, decimals } = req.body;
    try {
        const asset = await Asset.create({ symbol, name, decimals });
        res.status(201).json(asset);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const updateAsset = async (req: Request, res: Response) => {
    try {
        const asset = await Asset.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(asset);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const getNetworks = async (req: Request, res: Response) => {
    try {
        const networks = await Network.find({});
        res.json(networks);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const createNetwork = async (req: Request, res: Response) => {
    const { name, chain } = req.body;
    try {
        const network = await Network.create({ name, chain });
        res.status(201).json(network);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const updateNetwork = async (req: Request, res: Response) => {
    try {
        const network = await Network.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(network);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const getWalletSettings = async (req: Request, res: Response) => {
    try {
        const settings = await WalletSettings.find({});
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const updateWalletSettings = async (req: Request, res: Response) => {
    console.log('UpdateWalletSettings called');
    console.log('Body:', req.body);
    console.log('File:', req.file);

    const { asset, network, centralWallet, enabled } = req.body;

    if (!asset || !network || !centralWallet) {
        console.error('Missing required fields');
        res.status(400).json({ error: 'Missing required fields: asset, network, centralWallet' });
        return;
    }

    // Check if a file was uploaded
    const qrCodeUrl = req.file ? req.file.path : undefined;

    try {
        const updateData: any = { centralWallet, enabled };
        if (qrCodeUrl) {
            updateData.qrCodeUrl = qrCodeUrl;
        }

        console.log('Upserting WalletSettings:', { asset, network, updateData });

        const settings = await WalletSettings.findOneAndUpdate(
            { asset, network },
            updateData,
            { upsert: true, new: true }
        );
        console.log('WalletSettings updated:', settings);
        res.json(settings);
    } catch (error) {
        console.error('Error updating WalletSettings:', error);
        res.status(500).json({ error: (error as Error).message });
    }
};

// --- Transaction Management ---

export const getPendingDeposits = async (req: Request, res: Response) => {
    try {
        const deposits = await Deposit.find({ status: 'pending' }).populate('userId', 'email');
        res.json(deposits);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const getDepositById = async (req: Request, res: Response): Promise<void> => {
    try {
        const deposit = await Deposit.findById(req.params.id).populate('userId', 'email');
        if (!deposit) {
            res.status(404).json({ error: 'Deposit not found' });
            return;
        }
        res.json(deposit);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const approveDeposit = async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const deposit = await Deposit.findById(req.params.id).session(session);
        if (!deposit || deposit.status !== 'pending') {
            throw new Error('Deposit not found or not pending');
        }

        deposit.status = 'approved';
        await deposit.save({ session });

        // Credit User Balance
        await Balance.findOneAndUpdate(
            { userId: deposit.userId, asset: deposit.asset },
            { 
                $inc: { amount: deposit.amount },
                $push: { depositTranches: { amount: deposit.amount, targetProfit: deposit.amount, cleared: false } }
            },
            { upsert: true, session }
        );

        await session.commitTransaction();

        // Create in-app notification
        await createNotification(
            deposit.userId,
            'Deposit Approved',
            `Your deposit of ${deposit.amount} ${deposit.asset} has been approved and credited to your account.`,
            'success'
        );

        // Send deposit approval email
        try {
            const user = await User.findById(deposit.userId);
            if (user) {
                await sendEmail({
                    email: user.email,
                    subject: 'Deposit Approved',
                    message: `Hello ${user.fullName},\n\nYour deposit of ${deposit.amount} ${deposit.asset} has been approved and credited to your account.\n\nBest regards,\nCrossChainX Team`,
                });
            }
        } catch (emailError) {
            console.error('Failed to send deposit email:', emailError);
        }

        res.json({ message: 'Deposit approved and balance credited' });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ error: (error as Error).message });
    } finally {
        session.endSession();
    }
};

export const rejectDeposit = async (req: Request, res: Response) => {
    try {
        const deposit = await Deposit.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
        res.json({ message: 'Deposit rejected', deposit });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const getPendingWithdrawals = async (req: Request, res: Response) => {
    try {
        const withdrawals = await Withdrawal.find({ status: 'pending' }).populate('userId', 'email');
        res.json(withdrawals);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const approveWithdrawal = async (req: Request, res: Response) => {
    const { txHash } = req.body; // Admin provides the transaction hash after manual transfer
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const withdrawal = await Withdrawal.findById(req.params.id).session(session);
        if (!withdrawal || withdrawal.status !== 'pending') {
            throw new Error('Withdrawal not found or not pending');
        }

        withdrawal.status = 'completed';

        // Backwards compatibility for old records missing amountReceived
        if (withdrawal.amountReceived === undefined) {
            withdrawal.amountReceived = withdrawal.amount - (withdrawal.fee || 0);
        }

        await withdrawal.save({ session });

        // Unlock and Deduct Balance
        // NOTE: In our withdrawal request we will lock the funds
        await Balance.findOneAndUpdate(
            { userId: withdrawal.userId, asset: withdrawal.asset },
            { $inc: { lockedAmount: -withdrawal.amount } },
            { session }
        );

        await session.commitTransaction();

        await createNotification(
            withdrawal.userId,
            'Withdrawal Approved',
            `Your withdrawal of ${withdrawal.amount} ${withdrawal.asset} has been processed successfully.`,
            'success'
        );

        // Send withdrawal approval email
        try {
            const user = await User.findById(withdrawal.userId);
            if (user) {
                await sendEmail({
                    email: user.email,
                    subject: 'Withdrawal Approved',
                    message: `Hello ${user.fullName},\n\nYour withdrawal of ${withdrawal.amount} ${withdrawal.asset} has been approved and processed.\n\nBest regards,\nCrossChainX Team`,
                });
            }
        } catch (emailError) {
            console.error('Failed to send withdrawal email:', emailError);
        }

        res.json({ message: 'Withdrawal approved and marked completed' });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ error: (error as Error).message });
    } finally {
        session.endSession();
    }
};

export const denyWithdrawal = async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const withdrawal = await Withdrawal.findById(req.params.id).session(session);
        if (!withdrawal || withdrawal.status !== 'pending') {
            throw new Error('Withdrawal not found or not pending');
        }

        withdrawal.status = 'denied';
        await withdrawal.save({ session });

        // Unlock and Restore Balance
        await Balance.findOneAndUpdate(
            { userId: withdrawal.userId, asset: withdrawal.asset },
            {
                $inc: {
                    amount: withdrawal.amount,
                    lockedAmount: -withdrawal.amount
                }
            },
            { session }
        );

        await session.commitTransaction();

        await createNotification(
            withdrawal.userId,
            'Withdrawal Denied',
            `Your withdrawal request for ${withdrawal.amount} ${withdrawal.asset} was denied and the funds have been returned to your balance.`,
            'error'
        );

        res.json({ message: 'Withdrawal denied and funds restored' });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ error: (error as Error).message });
    } finally {
        session.endSession();
    }
};

export const getAllBalances = async (req: Request, res: Response) => {
    try {
        const balances = await Balance.find({}).populate('userId', 'email');
        res.json(balances);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};
