import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Signal } from '../models/Signal.js';
import { Trade } from '../models/Trade.js';
import { Balance } from '../models/WalletData.js';
import User from '../models/User.js';
import { startIntervalMonitor } from '../services/signalService.js';

dotenv.config();

const testSignal = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('Connected to DB');

        // 1. Get a test user
        const user = await User.findOne({ role: 'admin' });
        if (!user) throw new Error('No user found');

        // 2. Create a signal that expires in 10 seconds
        const now = new Date();
        const startTime = new Date(now.getTime() - 5000); // 5 seconds ago
        const endTime = new Date(now.getTime() + 5000);   // 5 seconds from now
        
        const signal = await Signal.create({
            symbol: 'TEST/USDT',
            startTime,
            endTime,
            profitPercentage: 0.1, // 10% for easy testing
            type: 'bonus',
            createdBy: user._id
        });
        console.log('Signal created:', signal._id);

        // 3. Create a trade linked to the signal
        const trade = await Trade.create({
            userId: user._id,
            signalId: signal._id,
            pair: 'TEST/USDT',
            type: 'buy',
            amount: 100,
            price: 50000,
            status: 'completed',
            isSettled: false
        });
        console.log('Trade created:', trade._id);

        // 4. Start the monitor script manually (or just trigger the function)
        console.log('Waiting for signal to expire...');
        
        // Wait 15 seconds
        await new Promise(resolve => setTimeout(resolve, 15000));

        // Manually trigger the "settleSignalTrades" logic since the monitor runs every minute
        // In a real scenario, the monitor would pick it up in its next tick.
        // For the test, we can just run the logic once.
        
        // Re-importing logic or just checking DB
        const updatedSignal = await Signal.findById(signal._id);
        console.log('Signal Status after 15s:', updatedSignal?.status);
        
        const updatedTrade = await Trade.findById(trade._id);
        console.log('Trade Settled:', updatedTrade?.isSettled);
        console.log('Trade PnL:', updatedTrade?.pnl);
        console.log('Trade Result:', updatedTrade?.resultStatus);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

testSignal();
