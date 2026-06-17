import { Resend } from 'resend';

interface EmailOptions {
    email: string;
    subject: string;
    message: string;
    html?: string;
}

const sendEmail = async (options: EmailOptions) => {
    const apiKey = process.env.RESEND_API_KEY;

    // If no API key — fallback to console log (development)
    if (!apiKey) {
        console.log('--- EMAIL LOG (no RESEND_API_KEY configured) ---');
        console.log(`To: ${options.email}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Message: ${options.message}`);
        console.log('-------------------------------------------------');
        return;
    }

    const resend = new Resend(apiKey);
    const fromEmail = process.env.FROM_EMAIL || 'noreply@crosschainx.app';

    const htmlBody = options.html || `
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
    `;

    try {
        const { data, error } = await resend.emails.send({
            from: `CrossChainX Support <${fromEmail}>`,
            to: [options.email],
            subject: options.subject,
            html: htmlBody,
            text: options.message,
        });

        if (error) {
            console.error(`❌ Resend error sending to ${options.email}:`, error);
            throw new Error(error.message);
        }

        console.log(`✅ Email sent to ${options.email} | ID: ${data?.id}`);
    } catch (err: any) {
        console.error(`❌ Failed to send email to ${options.email}:`, err.message);
        throw err;
    }
};

export default sendEmail;
