import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { Trade } from '../models/Trade.js';
import { Balance } from '../models/WalletData.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { findMatchingSignal, autoSettleTrade } from '../services/signalService.js';
import { Signal } from '../models/Signal.js';
import { createNotification } from '../utils/notificationHelper.js';

// --- User Trading ---

export const executeTrade = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
        res.status(401).json({ error: 'User not found' });
        return;
    }

    const { pair, type, amount, price } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const user = await User.findById(req.user._id).session(session);
        if (!user) throw new Error('User record not found');

        const balance = await Balance.findOne({ userId: req.user._id, asset: 'USDT' }).session(session);
        if (!balance || balance.amount < 200) {
            throw new Error('Minimum balance of 200 USDT is required to trade');
        }
        if (balance.amount < amount) {
            throw new Error('Insufficient USDT balance to execute trade');
        }

        // Check if trade amount is exactly 1% of the balance (allow 0.01 margin for float rounding)
        const onePercent = balance.amount * 0.01;
        const isSignalEligible = amount <= onePercent + 0.01 && amount >= onePercent - 0.01;

        // Deduct principal
        balance.amount -= amount;
        await balance.save({ session });

        const tradeResults = await Trade.create([{
            userId: req.user._id,
            pair,
            type,
            amount,
            price,
            status: 'completed',
            pnl: 0,
            resultStatus: 'pending',
            isSignalEligible,
            isSettled: false
        }], { session });

        const trade = tradeResults[0];

        await session.commitTransaction();
        session.endSession();

        res.status(201).json(trade);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ error: (error as Error).message });
    }
};

export const getMyTrades = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
        res.status(401).json({ error: 'User not found' });
        return;
    }

    try {
        const trades = await Trade.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json(trades);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};


// --- Admin PnL Settlement ---

export const getPendingSettlements = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({ error: 'Admin access required' });
        return;
    }

    try {
        const trades = await Trade.find({ isSettled: false })
            .populate('userId', 'email fullName')
            .sort({ createdAt: -1 })
            .lean();

        // For each trade, try to find a matching signal
        const tradesWithSignals = await Promise.all(trades.map(async (trade) => {
            const matchingSignal = await Signal.findOne({
                symbol: trade.pair,
                side: trade.type,
                startTime: { $lte: trade.createdAt },
                endTime: { $gte: trade.createdAt },
                status: { $in: ['active', 'expired'] }
            });

            return {
                ...trade,
                matchedSignal: matchingSignal || null
            };
        }));

        res.json(tradesWithSignals);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const settleManualTrade = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({ error: 'Admin access required' });
        return;
    }

    const { tradeId, resultStatus, pnlAmount, signalId } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const trade = await Trade.findById(tradeId).session(session);
        if (!trade || trade.isSettled) {
            throw new Error('Trade not found or already settled');
        }

        const balance = await Balance.findOne({ userId: trade.userId, asset: 'USDT' }).session(session);
        if (!balance) throw new Error('User balance record not found');

        // Final Balance = Original Balance + Trade Amount + PnL
        balance.amount += (trade.amount + pnlAmount);
        
        // Apply profit to deposit tranches
        if (pnlAmount > 0) {
            balance.clearedBalance += pnlAmount;
            let appliedProfit = pnlAmount;
            for (let tranche of balance.depositTranches) {
                if (!tranche.cleared && appliedProfit > 0) {
                    if (appliedProfit >= tranche.targetProfit) {
                        appliedProfit -= tranche.targetProfit;
                        tranche.targetProfit = 0;
                        tranche.cleared = true;
                        balance.clearedBalance += tranche.amount;
                    } else {
                        tranche.targetProfit -= appliedProfit;
                        appliedProfit = 0;
                    }
                }
            }
        }
        
        await balance.save({ session });

        trade.isSettled = true;
        trade.resultStatus = resultStatus;
        trade.pnl = pnlAmount;
        if (signalId) {
            trade.signalId = signalId;
        }
        await trade.save({ session });

        await session.commitTransaction();

        await createNotification(
            trade.userId,
            `Trade Settled (${resultStatus.toUpperCase()})`,
            `Your trade on ${trade.pair} has been settled. PnL: ${pnlAmount} USDT.`,
            resultStatus === 'win' ? 'success' : resultStatus === 'loss' ? 'error' : 'info'
        );

        res.json({ message: 'Trade settled successfully', trade });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ error: (error as Error).message });
    } finally {
        session.endSession();
    }
};
