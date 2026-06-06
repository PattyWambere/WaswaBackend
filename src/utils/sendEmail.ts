import nodemailer from 'nodemailer';

interface EmailOptions {
    email: string;
    subject: string;
    message: string;
    html?: string;
}

const sendEmail = async (options: EmailOptions) => {
    // If no SMTP user is provided, just log to console for development
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('--- EMAIL LOG (no SMTP configured) ---');
        console.log(`To: ${options.email}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Message: ${options.message}`);
        console.log('--------------------------------------');
        return;
    }

    // Gmail requires using the `service` option exclusively (not host+port)
    // This avoids conflicts that cause silent failures on Render
    const isGmail = (process.env.SMTP_HOST || '').toLowerCase().includes('gmail') ||
                    (process.env.SMTP_USER || '').toLowerCase().includes('gmail.com');

    let transportConfig: any;

    if (isGmail) {
        // Gmail: use service mode — ignores host/port and uses Google's official endpoints
        transportConfig = {
            service: 'gmail',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS, // Must be a Gmail App Password, NOT your regular password
            },
        };
    } else {
        // Generic SMTP (e.g. SendGrid, Mailgun, etc.)
        const port = Number(process.env.SMTP_PORT) || 587;
        transportConfig = {
            host: process.env.SMTP_HOST,
            port: port,
            secure: port === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        };
    }

    const transporter = nodemailer.createTransport(transportConfig);

    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;

    const mailOptions = {
        from: `"CrossChainX Support" <${fromEmail}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html || `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 32px;">
                    <h1 style="color: #0f172a; font-size: 28px; margin: 0; letter-spacing: 1px;">CrossChainX</h1>
                    <p style="color: #38bdf8; font-size: 13px; margin: 4px 0 0;">Secure USDT Trading Platform</p>
                </div>
                <div style="color: #334155; font-size: 16px; line-height: 1.7; padding: 24px; background: #f8fafc; border-radius: 8px;">
                    ${options.message.replace(/\n/g, '<br>')}
                </div>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
                <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
                    This is an automated message from CrossChainX. Please do not reply to this email.<br/>
                    &copy; ${new Date().getFullYear()} CrossChainX. All rights reserved.
                </p>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${options.email} | MessageId: ${info.messageId}`);
    } catch (err: any) {
        console.error(`❌ Failed to send email to ${options.email}:`, err.message);
        throw err; // Re-throw so callers can handle it
    }
};

export default sendEmail;
