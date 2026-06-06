import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
    console.warn('⚠️ Cloudinary credentials missing in .env! File uploads will fail.');
}

cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'crosstradex_wallets',
        allowed_formats: ['jpg', 'png', 'jpeg'],
        transformation: [{ width: 500, height: 500, crop: 'limit' }]
    } as any // Cast to any to avoid strict type issues with params
});

export const upload = multer({ storage: storage });
export default cloudinary;
