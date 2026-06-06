import { Signal } from '../models/Signal.js';
import { Trade } from '../models/Trade.js';
import { Balance } from '../models/WalletData.js';
import mongoose from 'mongoose';
import { createNotification } from '../utils/notificationHelper.js';

export const findMatchingSignal = async (trade: any) => {
    return await Signal.findOne({
        symbol: trade.pair,
        side: trade.type,
        startTime: { $lte: trade.createdAt || new Date() },
        endTime: { $gte: trade.createdAt || new Date() },
        status: 'active'
    });
};

export const autoSettleTrade = async (trade: any, signal: any) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const balance = await Balance.findOne({ userId: trade.userId, asset: 'USDT' }).session(session);
        if (!balance) throw new Error('User balance record not found');

        // Profit calculation
        const profit = trade.amount * signal.profitPercentage;
        const totalReturn = trade.amount + profit;

        // Final Balance = Original Balance + Trade Amount + PnL
        // Principal was already deducted in executeTrade.
        balance.amount += totalReturn;

        // Apply profit to deposit tranches
        if (profit > 0) {
            balance.clearedBalance += profit;
            let appliedProfit = profit;
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

        // Update trade status
        trade.isSettled = true;
        trade.pnl = profit;
        trade.resultStatus = 'win';
        trade.signalId = signal._id;
        await trade.save({ session });

        await session.commitTransaction();

        await createNotification(
            trade.userId,
            'Trade Auto-Settled (WIN)',
            `Your trade on ${trade.pair} has been auto-settled via signal. PnL: +${profit} USDT.`,
            'success'
        );

        console.log(`🤖 Auto-settled trade ${trade._id} for user ${trade.userId} via signal ${signal.symbol}`);
        return true;
    } catch (error) {
        await session.abortTransaction();
        console.error(`❌ Auto-settlement failed for trade ${trade._id}:`, error);
        return false;
    } finally {
        session.endSession();
    }
};

export const startIntervalMonitor = () => {
    console.log('🚀 Signal Interval Monitor started (Interval: 1m)');
    
    const monitorTask = async () => {
        try {
            if (mongoose.connection.readyState !== 1) {
                console.log('⏳ Mongoose not connected yet. Skipping signal monitor tick.');
                return;
            }
            const now = new Date();
            // console.log(`🔍 Monitor Check: ${now.toISOString()}`);

            // 1. Expire past signals
            const expiredResult = await Signal.updateMany(
                { endTime: { $lt: now }, status: 'active' },
                { $set: { status: 'expired' } }
            );
            
            if (expiredResult.modifiedCount > 0) {
                console.log(`⏱️ Expired ${expiredResult.modifiedCount} signals at ${now.toISOString()}`);
            }

            // 2. Auto-settle pending trades against EXPIRED signals ONLY
            const expiredSignals = await Signal.find({ status: 'expired' });
            
            if (expiredSignals.length > 0) {
                const pendingTrades = await Trade.find({ isSettled: false, isSignalEligible: true });
                
                for (const trade of pendingTrades) {
                    const matchingSignal = expiredSignals.find(s => 
                        s.symbol === trade.pair &&
                        s.side === trade.type &&
                        new Date(s.startTime) <= new Date(trade.createdAt) &&
                        new Date(s.endTime) >= new Date(trade.createdAt)
                    );

                    if (matchingSignal) {
                        console.log(`🎯 Auto-settling trade ${trade._id} against expired signal ${matchingSignal.symbol}`);
                        await autoSettleTrade(trade, matchingSignal);
                    }
                }
            }
        } catch (error) {
            console.error('❌ Signal Monitor Error:', error);
        }
    };

    // Run immediately
    monitorTask();

    // Run every minute
    setInterval(monitorTask, 60000);
};
