import { Schema, model, Document } from 'mongoose';

// --- ASSET ---
export interface IAsset extends Document {
    symbol: string; // e.g., USDT
    name: string;   // e.g., Tether
    decimals: number;
    enabled: boolean;
}

const AssetSchema = new Schema<IAsset>({
    symbol: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true },
    decimals: { type: Number, required: true, default: 6 },
    enabled: { type: Boolean, default: true }
});

export const Asset = model<IAsset>('Asset', AssetSchema);

// --- NETWORK ---
export interface INetwork extends Document {
    name: string;  // e.g., TRC20, ERC20
    chain: string; // e.g., TRON, Ethereum
    enabled: boolean;
}

const NetworkSchema = new Schema<INetwork>({
    name: { type: String, required: true, unique: true },
    chain: { type: String, required: true },
    enabled: { type: Boolean, default: true }
});

export const Network = model<INetwork>('Network', NetworkSchema);

// --- APP SETTINGS (Maintenance, etc) ---
export interface IAppSettings extends Document {
    maintenanceMode: boolean;
    maintenanceMessage?: string;
    updatedBy?: string;
}

const AppSettingsSchema = new Schema<IAppSettings>({
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: 'System is currently under maintenance. Please try again later.' },
    updatedBy: { type: String }
}, { timestamps: true });

export const AppSettings = model<IAppSettings>('AppSettings', AppSettingsSchema);
