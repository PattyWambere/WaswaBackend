import { Schema, model, Document, Types } from 'mongoose';

export interface ITrade extends Document {
    userId: Types.ObjectId;
    pair: string;
    type: 'buy' | 'sell';
    amount: number;
    price: number;
    status: 'pending' | 'completed' | 'failed';
    pnl?: number; // amount of profit or loss
    resultStatus?: 'pending' | 'win' | 'loss';
    signalId?: Types.ObjectId;
    isSignalEligible: boolean;
    isSettled: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const TradeSchema = new Schema<ITrade>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    signalId: { type: Schema.Types.ObjectId, ref: 'Signal' },
    pair: { type: String, required: true },
    type: { type: String, enum: ['buy', 'sell'], required: true },
    amount: { type: Number, required: true },
    price: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
    pnl: { type: Number, default: 0 },
    resultStatus: { type: String, enum: ['pending', 'win', 'loss'], default: 'pending' },
    isSignalEligible: { type: Boolean, default: false },
    isSettled: { type: Boolean, default: false }
}, { timestamps: true });

export const Trade = model<ITrade>('Trade', TradeSchema);
