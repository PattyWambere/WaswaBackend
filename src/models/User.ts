import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
    fullName: string;
    email: string;
    phoneNumber?: string;
    passwordHash: string;
    role: 'user' | 'admin';
    resetPasswordToken?: string;
    resetPasswordExpire?: Date;
    followingCode?: string;
    isVerified: boolean;
    verificationOtp?: string;
    verificationOtpExpire?: Date;
    savedWallets?: { network: string; address: string }[];
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phoneNumber: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    followingCode: String,
    isVerified: { type: Boolean, default: true },
    verificationOtp: String,
    verificationOtpExpire: Date,
    savedWallets: [{
        network: { type: String, required: true },
        address: { type: String, required: true }
    }]
}, { timestamps: true });

export default model<IUser>('User', UserSchema);
