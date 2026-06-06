import { Schema, model, Document, Types } from 'mongoose';

export interface ISignal extends Document {
    symbol: string;
    startTime: Date;
    endTime: Date;
    entryPrice: number;
    profitPercentage: number;
    side: 'buy' | 'sell';
    type: 'daily' | 'bonus';
    status: 'active' | 'expired' | 'cancelled';
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const SignalSchema = new Schema<ISignal>({
    symbol: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    entryPrice: { type: Number, required: true },
    profitPercentage: { type: Number, default: 0.005 },
    side: { type: String, enum: ['buy', 'sell'], default: 'buy' },
    type: { type: String, enum: ['daily', 'bonus'], default: 'daily' },
    status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export const Signal = model<ISignal>('Signal', SignalSchema);
