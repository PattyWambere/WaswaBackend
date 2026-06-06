import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Asset, Network } from './src/models/SystemConfig';

dotenv.config();

const checkData = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not defined in .env');
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const assets = await Asset.find({});
        const networks = await Network.find({});

        console.log('--- Assets ---');
        console.log(JSON.stringify(assets, null, 2));

        console.log('--- Networks ---');
        console.log(JSON.stringify(networks, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('❌ Error checking data:', error);
        process.exit(1);
    }
};

checkData();
