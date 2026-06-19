import dotenv from 'dotenv';
import mongoose from 'mongoose';
import crypto from 'crypto';
import User from '../models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('MONGO_URI is not defined in .env');
    process.exit(1);
}

const generateReferralCode = () => crypto.randomBytes(4).toString('hex').toUpperCase();

const run = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        // Find users who don't have a referralCode
        const usersToBackfill = await User.find({
            $or: [
                { referralCode: { $exists: false } },
                { referralCode: null },
                { referralCode: '' }
            ]
        });

        console.log(`Found ${usersToBackfill.length} users to backfill.`);

        for (const user of usersToBackfill) {
            let newCode = '';
            let codeExists = true;
            while (codeExists) {
                newCode = generateReferralCode();
                const existingCodeUser = await User.findOne({ referralCode: newCode });
                if (!existingCodeUser) {
                    codeExists = false;
                }
            }

            await User.updateOne({ _id: user._id }, { $set: { referralCode: newCode } });
            console.log(`Assigned code ${newCode} to user ${user.email}`);
        }

        console.log('Backfill completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed.');
    }
};

run();
