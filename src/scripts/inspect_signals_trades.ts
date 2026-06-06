import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Signal } from '../models/Signal.js';
import { Trade } from '../models/Trade.js';

dotenv.config();

const run = async () => {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            throw new Error('MONGO_URI is not defined in .env');
        }
        console.log('Connecting to:', uri);
        await mongoose.connect(uri);
        console.log('Connected to DB');

        const signals = await Signal.find({}).sort({ startTime: -1 }).limit(10);
        console.log('--- LATEST 10 SIGNALS ---');
        signals.forEach(s => {
            console.log({
                _id: s._id,
                symbol: s.symbol,
                side: s.side,
                type: (s as any).type || 'N/A',
                startTime: s.startTime,
                endTime: s.endTime,
                status: s.status,
                profitPercentage: s.profitPercentage
            });
        });

        const trades = await Trade.find({}).sort({ createdAt: -1 }).limit(10);
        console.log('--- LATEST 10 TRADES ---');
        trades.forEach(t => {
            console.log({
                _id: t._id,
                pair: t.pair,
                type: t.type,
                amount: t.amount,
                price: t.price,
                isSettled: t.isSettled,
                status: t.status,
                resultStatus: t.resultStatus,
                pnl: t.pnl,
                signalId: t.signalId,
                createdAt: t.createdAt
            });
        });

    } catch (err: any) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
};

run();
