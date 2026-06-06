import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import sendEmail from '../utils/sendEmail.js';

const generateToken = (id: string) => {
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    // Cast to any to avoid "Type string is not assignable to StringValue" issues with some @types versions
    const expiresIn = (process.env.JWT_EXPIRES_IN || '24h') as any;

    return jwt.sign({ id }, secret, { expiresIn });
};

export const registerUser = async (req: Request, res: Response): Promise<void> => {
    const { fullName, email, phoneNumber, password } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400).json({ error: 'User already exists' });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // All new registrations from the public endpoint default to 'user'
        const userRole = 'user';

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpire = new Date();
        otpExpire.setMinutes(otpExpire.getMinutes() + 10); // 10 minutes

        const user = await User.create({
            fullName,
            email,
            phoneNumber,
            passwordHash,
            role: userRole,
            isVerified: false,
            verificationOtp: otp,
            verificationOtpExpire: otpExpire,
        });

        // Send registration email
        try {
            await sendEmail({
                email: user.email,
                subject: 'Verify your email for CrossChainX',
                message: `Hello ${user.fullName},\n\nYour verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nBest regards,\nCrossChainX Team`,
            });
        } catch (emailError) {
            console.error('Failed to send registration email:', emailError);
        }

        res.status(201).json({
            message: 'Registration successful. Please verify your email.',
            email: user.email
        });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (user && (await bcrypt.compare(password, user.passwordHash))) {
            if (!user.isVerified) {
                res.status(401).json({ error: 'unverified_email' });
                return;
            }
            res.json({
                _id: user._id,
                email: user.email,
                role: user.role,
                token: generateToken(user._id.toString()),
            });
        } else {
            res.status(401).json({ error: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Generate token
        const resetToken = crypto.randomBytes(32).toString('hex');

        // Hash token and set to field
        user.resetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // Set expire (1 hour)
        user.resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000);

        await user.save();

        const origin = req.get('origin') || process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetUrl = `${origin}/reset-password/${resetToken}`;

        const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please click the link below or copy it to your browser: \n\n ${resetUrl}`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset Token',
                message,
            });

            res.status(200).json({ message: 'Email sent' });
        } catch (error) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
            res.status(500).json({ error: 'Email could not be sent' });
        }
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    const { password } = req.body;
    const { token } = req.params;

    if (!token || !password) {
        res.status(400).json({ error: 'Token and password are required' });
        return;
    }

    try {
        // Hash the token from URL
        const hashedToken = crypto
            .createHash('sha256')
            .update(token as string)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            res.status(400).json({ error: 'Invalid or expired reset token' });
            return;
        }

        // Set and hash new password
        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
    const { oldPassword, newPassword } = req.body;
    const userId = (req as any).user?._id;

    try {
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Check old password
        const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!isMatch) {
            res.status(400).json({ error: 'Incorrect old password' });
            return;
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(newPassword, salt);

        await user.save();

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?._id;

    try {
        const user = await User.findById(userId).select('-passwordHash');
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?._id;
    const { fullName, phoneNumber } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        if (fullName) user.fullName = fullName;
        if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;

        await user.save();

        res.json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
        });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        if (user.isVerified) {
            res.status(400).json({ error: 'User is already verified' });
            return;
        }

        if (user.verificationOtp !== otp) {
            res.status(400).json({ error: 'Invalid verification code' });
            return;
        }

        if (user.verificationOtpExpire && user.verificationOtpExpire < new Date()) {
            res.status(400).json({ error: 'Verification code has expired' });
            return;
        }

        user.isVerified = true;
        user.verificationOtp = undefined;
        user.verificationOtpExpire = undefined;
        await user.save();

        res.status(200).json({
            _id: user._id,
            email: user.email,
            role: user.role,
            token: generateToken(user._id.toString()),
        });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const resendOtp = async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        if (user.isVerified) {
            res.status(400).json({ error: 'User is already verified' });
            return;
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpire = new Date();
        otpExpire.setMinutes(otpExpire.getMinutes() + 10);

        user.verificationOtp = otp;
        user.verificationOtpExpire = otpExpire;
        await user.save();

        try {
            await sendEmail({
                email: user.email,
                subject: 'Your new verification code for CrossChainX',
                message: `Hello ${user.fullName},\n\nYour new verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nBest regards,\nCrossChainX Team`,
            });
        } catch (emailError) {
            console.error('Failed to send OTP email:', emailError);
            res.status(500).json({ error: 'Failed to send verification email' });
            return;
        }

        res.status(200).json({ message: 'Verification code resent successfully' });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};
