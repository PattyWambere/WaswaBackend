import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { Asset, Network } from '../models/SystemConfig.js';
import { WalletSettings, Balance } from '../models/WalletData.js';
import { Deposit, Withdrawal } from '../models/Transaction.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// --- User Data ---

export const getMyBalances = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
        res.status(401).json({ error: 'User not found' });
        return;
    }
    try {
        const balances = await Balance.find({ userId: req.user._id });
        res.json(balances);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const getAssetConfig = async (req: AuthRequest, res: Response) => {
    try {
        const assets = await Asset.find({ enabled: true });
        const networks = await Network.find({ enabled: true });
        const walletSettings = await WalletSettings.find({ enabled: true });

        res.json({ assets, networks, walletSettings });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

// --- Transactions ---

export const submitDeposit = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
        res.status(401).json({ error: 'User not found' });
        return;
    }
    const { asset, network, amount, txHash } = req.body;
    const file = (req as any).file;

    if (!txHash && !file) {
        res.status(400).json({ error: 'Please provide a transaction ID or upload a screenshot proof' });
        return;
    }

    try {
        const depositData: any = {
            userId: req.user._id,
            asset,
            network,
            amount: Number(amount),
            binanceId: 'N/A',
            status: 'pending'
        };

        if (txHash) depositData.txHash = txHash;
        if (file?.path) depositData.proofImageUrl = file.path;

        const deposit = await Deposit.create(depositData);

        res.status(201).json(deposit);
    } catch (error) {
        console.error("Deposit Error:", error);
        res.status(500).json({ error: (error as Error).message });
    }
};

export const requestWithdrawal = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
        res.status(401).json({ error: 'User not found' });
        return;
    }
    const { asset, network, amount, walletAddress } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Check Balance
        const balance = await Balance.findOne({ userId: req.user._id, asset }).session(session);
        if (!balance || balance.amount < amount) {
            throw new Error('Insufficient balance');
        }

        // 1.5 Check/Lock Wallet Address
        const userDoc = await User.findById(req.user._id).session(session);
        if (!userDoc) throw new Error('User not found');

        if (!userDoc.savedWallets) {
            userDoc.savedWallets = [];
        }
        
        const existingWallet = userDoc.savedWallets.find(w => w.network === network);
        if (existingWallet) {
            if (existingWallet.address !== walletAddress) {
                throw new Error(`Security Alert: Your withdrawal wallet for ${network} is permanently locked to ${existingWallet.address}`);
            }
        } else {
            // First time using this network, lock it!
            userDoc.savedWallets.push({ network, address: walletAddress });
            await userDoc.save({ session });
        }

        // Calculate fee
        let fee = 0;
        const clearedBal = balance.clearedBalance || 0;
        
        if (amount > clearedBal) {
            const unclearedAmount = amount - clearedBal;
            fee = unclearedAmount * 0.20;
            balance.clearedBalance = 0;
        } else {
            balance.clearedBalance -= amount;
        }
        const amountReceived = amount - fee;

        // 2. Lock Balance
        balance.amount -= amount;
        balance.lockedAmount += amount;
        await balance.save({ session });

        // 3. Create Withdrawal Request
        const withdrawal = await Withdrawal.create([{
            userId: req.user._id,
            asset,
            network,
            amount,
            fee,
            amountReceived,
            walletAddress,
            status: 'pending'
        }], { session });

        await session.commitTransaction();
        res.status(201).json(withdrawal[0]);
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ error: (error as Error).message });
    } finally {
        session.endSession();
    }
};

export const getMyTransactionHistory = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
        res.status(401).json({ error: 'User not found' });
        return;
    }
    try {
        const deposits = await Deposit.find({ userId: req.user._id });
        const withdrawals = await Withdrawal.find({ userId: req.user._id });

        // Merge and sort by date descending
        const history = [
            ...deposits.map(d => ({ ...d.toObject(), type: 'deposit' })),
            ...withdrawals.map(w => ({ ...w.toObject(), type: 'withdrawal' }))
        ].sort((a: any, b: any) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });

        res.json(history);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};
