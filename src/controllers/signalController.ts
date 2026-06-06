import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { Signal } from '../models/Signal.js';
import { Trade } from '../models/Trade.js';
import { Balance } from '../models/WalletData.js';
import mongoose from 'mongoose';

// --- Admin Section ---

export const createSignal = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { symbol, startTime, endTime, entryPrice, profitPercentage, type, side } = req.body;
        
        if (!req.user) {
            res.status(401).json({ error: 'User not found' });
            return;
        }

        const signal = await Signal.create({
            symbol,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            entryPrice,
            profitPercentage: profitPercentage || 0.005,
            side: side || 'buy',
            type: type || 'daily',
            createdBy: req.user._id,
            status: 'active'
        });

        res.status(201).json(signal);
    } catch (error) {
        console.error('Error creating signal:', error);
        res.status(400).json({ error: (error as Error).message });
    }
};

export const getAdminSignals = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const signals = await Signal.find().sort({ createdAt: -1 });
        res.json(signals);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};
