import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Asset, Network } from '../models/SystemConfig.js';

dotenv.config();

const seedData = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not defined in .env');
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB connected successfully');

        // Assets
        const assets = [
            { symbol: 'USDT', name: 'Tether', decimals: 6, enabled: true },
            { symbol: 'USDC', name: 'USD Coin', decimals: 6, enabled: true },
            { symbol: 'ETH', name: 'Ethereum', decimals: 18, enabled: true },
            { symbol: 'BTC', name: 'Bitcoin', decimals: 8, enabled: true }
        ];

        for (const a of assets) {
            await Asset.findOneAndUpdate(
                { symbol: a.symbol },
                a,
                { upsert: true, new: true }
            );
            console.log(`Synced Asset: ${a.symbol}`);
        }

        // Networks
        const networks = [
            { name: 'TRC20', chain: 'TRON', enabled: true },
            { name: 'ERC20', chain: 'Ethereum', enabled: true },
            { name: 'BEP20', chain: 'Binance Smart Chain', enabled: true },
            { name: 'BTC', chain: 'Bitcoin', enabled: true }
        ];

        for (const n of networks) {
            await Network.findOneAndUpdate(
                { name: n.name },
                n,
                { upsert: true, new: true }
            );
            console.log(`Synced Network: ${n.name}`);
        }

        console.log('✅ Database seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedData();
