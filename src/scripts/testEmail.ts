import dotenv from 'dotenv';
import sendEmail from '../utils/sendEmail.js';

dotenv.config();

const test = async () => {
    console.log('Testing SMTP connection with settings:');
    console.log('Host:', process.env.SMTP_HOST);
    console.log('Port:', process.env.SMTP_PORT);
    console.log('User:', process.env.SMTP_USER);

    try {
        await sendEmail({
            email: 'patty.nobleman@gmail.com',
            subject: 'Test Email from CrossChainX Dev',
            message: 'Hello, this is a test email to verify SMTP functionality.'
        });
        console.log('✅ Email sent successfully!');
    } catch (err) {
        console.error('❌ Email failed to send:', err);
    }
};

test();
