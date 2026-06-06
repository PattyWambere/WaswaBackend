import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Asset, Network } from './models/SystemConfig.js';
import { WalletSettings } from './models/WalletData.js';

dotenv.config();

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('Connected for seeding...');

        // 1. Create USDT Asset
        const usdt = await Asset.findOneAndUpdate(
            { symbol: 'USDT' },
            { name: 'Tether', decimals: 6, enabled: true },
            { upsert: true, new: true }
        );
        console.log('USDT Asset initialized');

        // 2. Create TRC20 Network
        const trc20 = await Network.findOneAndUpdate(
            { name: 'TRC20' },
            { chain: 'TRON', enabled: true },
            { upsert: true, new: true }
        );
        console.log('TRC20 Network initialized');

        // 3. Set Central Wallet
        await WalletSettings.findOneAndUpdate(
            { asset: 'USDT', network: 'TRC20' },
            {
                centralWallet: 'TY89pX5f7K2WnLz1DqM4B6S3vTpR5mQ6cW', // Example TRON address
                enabled: true
            },
            { upsert: true }
        );
        console.log('Central Wallet for USDT/TRC20 initialized');

        console.log('✅ Seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seed();
