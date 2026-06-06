import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('Connected to DB:', mongoose.connection.db?.databaseName);

        const db = mongoose.connection.db!;

        // List all collections
        const collections = await db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        // For each collection, list its indexes
        for (const col of collections) {
            const indexes = await db.collection(col.name).indexes();
            console.log(`\n${col.name} indexes:`);
            indexes.forEach(idx => console.log(' -', JSON.stringify(idx)));
        }

    } catch (err: any) {
        console.error('Error:', err.message);
    } finally {
        await mongoose.disconnect();
    }
};

run();
