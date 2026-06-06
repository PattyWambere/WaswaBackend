import { Request, Response, NextFunction } from 'express';
import { AppSettings } from '../models/SystemConfig.js';

export const checkMaintenanceMode = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const settings = await AppSettings.findOne({});

        // If maintenance mode is ON
        if (settings?.maintenanceMode) {
            const user = (req as any).user;

            // Allow admins to bypass maintenance mode
            if (user && user.role === 'admin') {
                return next();
            }

            return res.status(503).json({
                error: 'maintenance_mode',
                message: settings.maintenanceMessage || 'System is currently under maintenance. Please try again later.'
            });
        }

        next();
    } catch (error) {
        next(); // Default to allowing if error occurs fetching settings
    }
};
