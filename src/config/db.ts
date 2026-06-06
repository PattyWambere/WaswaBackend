import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI as string);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Sync indexes: this will drop stale indexes (like non-sparse txHash_1)
        // and rebuild them according to the current schema definitions
        const { Deposit } = await import('../models/Transaction.js');
        const { Withdrawal } = await import('../models/Transaction.js');
        await Deposit.syncIndexes();
        await Withdrawal.syncIndexes();
        console.log('Indexes synced successfully');

    } catch (error) {
        console.error(`Error: ${(error as Error).message}`);
        process.exit(1);
    }
};

export default connectDB;

