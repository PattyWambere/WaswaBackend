import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { Notification } from '../models/Notification.js';

export const getMyNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
        res.status(401).json({ error: 'User not found' });
        return;
    }
    try {
        const notifications = await Notification.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(100); // Limit to last 100 to prevent massive payloads
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
        res.status(401).json({ error: 'User not found' });
        return;
    }
    const { id } = req.params;
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: id, userId: req.user._id },
            { read: true },
            { new: true }
        );
        if (!notification) {
            res.status(404).json({ error: 'Notification not found' });
            return;
        }
        res.json(notification);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
        res.status(401).json({ error: 'User not found' });
        return;
    }
    try {
        await Notification.updateMany(
            { userId: req.user._id, read: false },
            { read: true }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
        res.status(401).json({ error: 'User not found' });
        return;
    }
    try {
        const count = await Notification.countDocuments({ userId: req.user._id, read: false });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};
