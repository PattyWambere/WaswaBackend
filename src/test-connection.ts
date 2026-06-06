import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

dotenv.config();

const uri = process.env.MONGO_URI || '';

console.log('Testing connection to:', uri.replace(/:([^:@]{1,})@/, ':****@'));

const test = async () => {
    try {
        console.log('--- DNS Check ---');
        const srv = await dns.promises.resolveSrv('_mongodb._tcp.crosschainx.nvhbzdg.mongodb.net');
        console.log('SRV Records found:', srv);

        console.log('\n--- Mongoose Connection Attempt ---');
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log('✅ Connection Successful!');
        process.exit(0);
    } catch (err: any) {
        console.error('❌ Connection Failed!');
        console.error('Error Code:', err.code);
        console.error('Error Message:', err.message);

        if (err.code === 'ECONNREFUSED' && uri.includes('+srv')) {
            console.log('\n💡 Suggestion: Try the non-SRV connection string format if your network blocks SRV lookups.');
        }
        process.exit(1);
    }
};

test();
