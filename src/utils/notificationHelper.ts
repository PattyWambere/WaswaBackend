import { Notification } from '../models/Notification.js';

export const createNotification = async (
    userId: any,
    title: string,
    message: string,
    type: 'success' | 'warning' | 'error' | 'info' = 'info',
    session?: any
): Promise<void> => {
    try {
        await Notification.create([{
            userId,
            title,
            message,
            type,
            read: false
        }], { session });
    } catch (error) {
        console.error('Failed to create notification:', error);
    }
};
