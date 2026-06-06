import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    try {
        const uri = process.env.MONGO_URI as string;
        console.log('Connecting to:', uri ? '(URI from env)' : 'MISSING ENV VAR');

        await mongoose.connect(uri);
        console.log('Connected to DB:', mongoose.connection.db?.databaseName);

        const collections = await mongoose.connection.db!.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        // Try all common deposit collection names
        const depositNames = ['deposits', 'deposit', 'Deposit', 'Deposits'];
        for (const name of depositNames) {
            try {
                const indexes = await mongoose.connection.db!.collection(name).indexes();
                console.log(`\n${name} indexes:`, JSON.stringify(indexes));

                const hasStaleIndex = indexes.some((idx: any) => idx.name === 'txHash_1' && !idx.sparse);
                if (hasStaleIndex) {
                    await mongoose.connection.db!.collection(name).dropIndex('txHash_1');
                    console.log(`✅ Dropped txHash_1 from ${name}`);
                }
            } catch (e: any) {
                if (e.codeName !== 'NamespaceNotFound') console.log(`${name}: ${e.message}`);
            }
        }

    } catch (err: any) {
        console.error('Error:', err.message);
    } finally {
        await mongoose.disconnect();
    }
};

run();
