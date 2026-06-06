import { Schema, model, Document, Types } from 'mongoose';

export interface INotification extends Document {
    userId: Types.ObjectId;
    title: string;
    message: string;
    type: 'success' | 'warning' | 'error' | 'info';
    read: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['success', 'warning', 'error', 'info'], default: 'info' },
    read: { type: Boolean, default: false },
}, { timestamps: true });

export const Notification = model<INotification>('Notification', NotificationSchema);
