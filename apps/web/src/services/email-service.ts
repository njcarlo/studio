import { Resend } from 'resend';

/**
 * Generic Email Service for sending notifications.
 * Uses official Resend SDK.
 */
export class EmailService {
    private static _resend: Resend | null = null;
    private static FROM_EMAIL = 'onboarding@resend.dev'; // Default sandbox sender

    private static get resend() {
        if (!this._resend && process.env.RESEND_API_KEY) {
            this._resend = new Resend(process.env.RESEND_API_KEY);
        }
        return this._resend;
    }

    /**
     * Sends an email using the Resend SDK.
     */
    static async sendEmail({
        to,
        subject,
        html,
        text,
    }: {
        to: string | string[];
        subject: string;
        html: string;
        text?: string;
    }) {
        if (!process.env.RESEND_API_KEY) {
            console.warn('RESEND_API_KEY is not set. Email notification skipped.');
            console.log('--- Mock Email ---');
            console.log('To:', to);
            console.log('Subject:', subject);
            console.log('Body:', text || 'HTML Content');
            console.log('------------------');
            return { success: true, mock: true };
        }

        try {
            const resend = this.resend;
            if (!resend) {
                throw new Error('Resend SDK failed to initialize even with API key.');
            }

            const { data, error } = await resend.emails.send({
                from: this.FROM_EMAIL,
                to: Array.isArray(to) ? to : [to],
                subject,
                html: html || (text as string),
                text: text,
            });

            if (error) {
                throw new Error(`Resend SDK error: ${JSON.stringify(error)}`);
            }

            return data;
        } catch (error) {
            console.error('Failed to send email:', error);
            throw error;
        }
    }
}
