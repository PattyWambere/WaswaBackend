import { Schema, model, Document, Types } from 'mongoose';

// --- WALLET SETTINGS ---
export interface IWalletSettings extends Document {
    asset: string;       // Symbol (e.g., USDT)
    network: string;     // Name (e.g., TRC20)
    centralWallet: string;
    qrCodeUrl?: string;
    enabled: boolean;
}

const WalletSettingsSchema = new Schema<IWalletSettings>({
    asset: { type: String, required: true },
    network: { type: String, required: true },
    centralWallet: { type: String, required: true },
    qrCodeUrl: { type: String },
    enabled: { type: Boolean, default: true }
});

// Composite unique index to prevent duplicate entries for same asset/network pair
WalletSettingsSchema.index({ asset: 1, network: 1 }, { unique: true });

export const WalletSettings = model<IWalletSettings>('WalletSettings', WalletSettingsSchema);

// --- BALANCES ---
export interface IDepositTranche {
    amount: number;
    targetProfit: number; // Profit needed to clear this deposit
    cleared: boolean;
}

export interface IBalance extends Document {
    userId: Types.ObjectId;
    asset: string;
    amount: number;
    lockedAmount: number; // For pending withdrawals
    clearedBalance: number; // Amount that can be withdrawn with 0% fee
    depositTranches: IDepositTranche[]; // List of deposits tracking their profit requirement
}

const DepositTrancheSchema = new Schema<IDepositTranche>({
    amount: { type: Number, required: true },
    targetProfit: { type: Number, required: true },
    cleared: { type: Boolean, default: false }
});

const BalanceSchema = new Schema<IBalance>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    asset: { type: String, required: true },
    amount: { type: Number, default: 0 },
    lockedAmount: { type: Number, default: 0 },
    clearedBalance: { type: Number, default: 0 },
    depositTranches: [DepositTrancheSchema]
});

BalanceSchema.index({ userId: 1, asset: 1 }, { unique: true });

export const Balance = model<IBalance>('Balance', BalanceSchema);
