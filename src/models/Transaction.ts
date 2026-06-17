import { Schema, model, Document, Types } from 'mongoose';

// --- DEPOSIT ---
export interface IDeposit extends Document {
    userId: Types.ObjectId;
    asset: string;
    network: string;
    amount: number;
    binanceId: string;
    txHash?: string;
    proofImageUrl?: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Date;
    updatedAt: Date;
}

const DepositSchema = new Schema<IDeposit>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    asset: { type: String, required: true },
    network: { type: String, required: true },
    amount: { type: Number, required: true },
    binanceId: { type: String, required: true },
    txHash: { type: String, unique: true, sparse: true },
    proofImageUrl: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });

export const Deposit = model<IDeposit>('Deposit', DepositSchema);

// --- WITHDRAWAL ---
export interface IWithdrawal extends Document {
    userId: Types.ObjectId;
    asset: string;
    network: string;
    amount: number;
    fee: number;
    amountReceived: number;
    walletAddress: string;
    status: 'pending' | 'approved' | 'denied' | 'completed';
    txHash?: string;
    createdAt: Date;
    updatedAt: Date;
}

const WithdrawalSchema = new Schema<IWithdrawal>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    asset: { type: String, required: true },
    network: { type: String, required: true },
    amount: { type: Number, required: true },
    fee: { type: Number, default: 0 },
    amountReceived: { type: Number, required: true },
    walletAddress: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'denied', 'completed'], default: 'pending' },
    txHash: { type: String, unique: true, sparse: true },
}, { timestamps: true });

export const Withdrawal = model<IWithdrawal>('Withdrawal', WithdrawalSchema);
