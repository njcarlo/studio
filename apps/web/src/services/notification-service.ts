import { prisma } from '@studio/database/prisma';
import { EmailService } from './email-service';
import type { ApprovalRequest } from '@/lib/types';
import { toJsDate } from '@/lib/utils';

/**
 * Orchestrates notifications for various workflows.
 */
export class NotificationService {
    private static APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

    /**
     * Notifies relevant approvers about a new approval request.
     */
    static async notifyNewRequest(request: any) {
        try {
            const recipients = await this.resolveRecipients(request);
            if (recipients.length === 0) {
                console.warn('No recipients found for approval request:', request.id);
                return;
            }

            const { subject, html, text } = this.formatNewRequestEmail(request);

            await EmailService.sendEmail({
                to: recipients,
                subject,
                html,
                text,
            });

            console.log(`Notification sent to ${recipients.length} recipients for request ${request.id}`);
        } catch (error) {
            console.error('Failed to send new request notification:', error);
        }
    }

    /**
     * Resolves email addresses of users who should be notified.
     */
    private static async resolveRecipients(request: ApprovalRequest): Promise<string[]> {
        // 1. If it's a Room Booking, notified the Ministry Approver if set
        if (request.type === 'Room Booking' && request.reservationId) {
            const booking = await prisma.booking.findUnique({
                where: { id: request.reservationId },
            });

            if (booking?.ministryId) {
                const ministry = await prisma.ministry.findUnique({
                    where: { id: booking.ministryId },
                });

                if (ministry?.approverId) {
                    const approver = await prisma.worker.findUnique({
                        where: { id: ministry.approverId },
                    });
                    if (approver?.email) {
                        return [approver.email];
                    }
                }
            }
        }

        // 2. Fallback: Notify all Admins and Approvers
        const approverRoles = await prisma.role.findMany({
            where: {
                OR: [
                    { name: 'Admin' },
                    { permissions: { has: 'manage_approvals' } },
                    { permissions: { has: 'approve_room_reservation' } },
                ],
            },
            select: { id: true },
        });

        const roleIds = approverRoles.map(r => r.id);

        const globalApprovers = await prisma.worker.findMany({
            where: {
                roleId: { in: roleIds },
                status: 'Active',
            },
            select: { email: true },
        });

        return globalApprovers.map(a => a.email).filter(Boolean) as string[];
    }

    /**
     * Formats the email content for a new approval request.
     */
    private static formatNewRequestEmail(request: ApprovalRequest) {
        const subject = `[Approval Required] New ${request.type} Request`;
        const approvalUrl = `${this.APP_URL}/approvals`; // Assuming there's an approvals page

        const html = `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #2563eb;">New Approval Request</h2>
                <p>A new <strong>${request.type}</strong> request has been submitted and requires your review.</p>
                
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Requester:</strong> ${request.requester}</p>
                    <p><strong>Date:</strong> ${toJsDate(request.date).toLocaleDateString()}</p>
                    <p><strong>Details:</strong> ${request.details}</p>
                </div>
                
                <a href="${approvalUrl}" 
                   style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    Review Request
                </a>
                
                <p style="margin-top: 30px; font-size: 0.875rem; color: #6b7280;">
                    This is an automated notification from the Studio management system.
                </p>
            </div>
        `;

        const text = `
            New Approval Request
            
            A new ${request.type} request has been submitted by ${request.requester}.
            
            Details: ${request.details}
            
            Review it here: ${approvalUrl}
        `;

        return { subject, html, text };
    }

    /**
     * Sends a password reset email.
     */
    static async sendPasswordResetEmail(email: string, resetLink: string) {
        try {
            const subject = '[Studio] Reset Your Password';
            const html = `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #2563eb;">Password Reset Request</h2>
                    <p>We received a request to reset your password for your Studio account.</p>
                    <p>Click the button below to set a new password:</p>
                    
                    <a href="${resetLink}" 
                       style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">
                        Reset Password
                    </a>
                    
                    <p>If you didn't request this, you can safely ignore this email.</p>
                    <p style="margin-top: 30px; font-size: 0.875rem; color: #6b7280;">
                        This link will expire in 1 hour.
                    </p>
                </div>
            `;

            const text = `
                Password Reset Request
                
                Click the link below to reset your password:
                ${resetLink}
                
                If you didn't request this, you can safely ignore this email.
            `;

            await EmailService.sendEmail({
                to: email,
                subject,
                html,
                text,
            });

            console.log(`Password reset email sent to ${email}`);
        } catch (error) {
            console.error('Failed to send password reset email:', error);
            throw error;
        }
    }
}
