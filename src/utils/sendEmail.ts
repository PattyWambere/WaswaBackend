import nodemailer from 'nodemailer';

interface EmailOptions {
    email: string;
    subject: string;
    message: string;
    html?: string;
}

const sendEmail = async (options: EmailOptions) => {
    // If no SMTP user is provided, just log to console for development
    if (!process.env.SMTP_USER) {
        console.log('--- DEVELOPMENT EMAIL LOG ---');
        console.log(`To: ${options.email}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Message: ${options.message}`);
        console.log('------------------------------');
        return;
    }

    const isGmail = process.env.SMTP_HOST?.includes('gmail');
    const port = Number(process.env.SMTP_PORT) || 587;

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: port,
        secure: port === 465, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        // For Gmail, we can optionally use service: 'gmail'
        ...(isGmail && { service: 'gmail' })
    });

    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;
    const mailOptions = {
        from: `"CrossTradeX Support" <${fromEmail}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html || `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
                <h2 style="color: #0f172a; margin-bottom: 24px; text-align: center;">CrossTradeX</h2>
                <div style="color: #334155; font-size: 16px; line-height: 1.6;">
                    ${options.message.replace(/\n/g, '<br>')}
                </div>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
                <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                    This is an automated message from CrossTradeX. Please do not reply to this email.
                </p>
            </div>
        `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
};

export default sendEmail;
