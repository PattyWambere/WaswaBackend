import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import connectDB from './config/db.js';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import userRoutes from './routes/userRoutes.js';
import tradeRoutes from './routes/tradeRoutes.js';
import signalRoutes from './routes/signalRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { checkMaintenanceMode } from './middleware/maintenanceMiddleware.js';
import { startIntervalMonitor } from './services/signalService.js';

dotenv.config();
await connectDB();

startIntervalMonitor();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.send('API is running...');
});

// Admin routes are always accessible to admins and should NOT check maintenance mode
app.use('/api/admin', adminRoutes);

// Auth routes (login/register) should be accessible to everyone until they are logged in
app.use('/api/auth', authRoutes);

// User routes - we check maintenance mode HERE. 
// Note: checkMaintenanceMode should ideally run AFTER protect to know the user role.
// I will apply it inside userRoutes.ts instead for better control.
app.use('/api/user', userRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/signals', signalRoutes);
app.use('/api/user/notifications', notificationRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
