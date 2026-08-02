import { prisma } from '@studio/database/prisma';
import { EmailService } from './email';

/**
 * Notification engine (Layer 2) — one entry point for delivering a message to a
 * set of recipients across channels (in-app + email).
 *
 * Callers resolve *who* to notify (RBAC / ministry fan-out lives in the domain);
 * this engine owns *how* delivery happens: dedupe recipients, write in-app rows,
 * fan out email, and never let a delivery failure bubble into the caller's
 * transaction. Both the approval engine and app-level notifications go through
 * `notify()` so channel behavior stays consistent.
 */

export type NotificationChannel = 'inApp' | 'email';

export type NotificationRecipient = {
  /** Worker id — required to receive the in-app channel. */
  userId?: string;
  /** Email address — required to receive the email channel. */
  email?: string;
};

export type NotificationInput = {
  recipients: NotificationRecipient[];
  title: string;
  body: string;
  /** In-app deep link (e.g. '/approvals'). */
  link?: string;
  /**
   * Channels to attempt. Defaults to both. A recipient is only delivered on a
   * channel it has the address for (userId for in-app, email for email).
   */
  channels?: NotificationChannel[];
  /**
   * Email overrides. When omitted, the subject/body are derived from
   * `title`/`body`. Set `enabled: false` to force in-app only regardless of
   * `channels`.
   */
  email?: {
    enabled?: boolean;
    subject?: string;
    html?: string;
    text?: string;
  };
};

export type NotificationResult = {
  inAppCount: number;
  emailCount: number;
};

function wantsChannel(input: NotificationInput, channel: NotificationChannel): boolean {
  const channels = input.channels ?? ['inApp', 'email'];
  if (channel === 'email' && input.email?.enabled === false) return false;
  return channels.includes(channel);
}

/**
 * Deliver a notification across channels. Best-effort: logs and swallows
 * per-channel failures so a notification never breaks the caller's flow.
 */
export async function notify(input: NotificationInput): Promise<NotificationResult> {
  const result: NotificationResult = { inAppCount: 0, emailCount: 0 };
  if (input.recipients.length === 0) return result;

  // Dedupe: one in-app row per userId, one email per address.
  const userIds = new Set<string>();
  const emails = new Set<string>();
  for (const r of input.recipients) {
    if (r.userId) userIds.add(r.userId);
    if (r.email) emails.add(r.email.trim().toLowerCase());
  }

  if (wantsChannel(input, 'inApp') && userIds.size > 0) {
    try {
      await prisma.inAppNotification.createMany({
        data: [...userIds].map((userId) => ({
          userId,
          title: input.title,
          body: input.body,
          link: input.link ?? null,
        })),
      });
      result.inAppCount = userIds.size;
    } catch (error) {
      console.error('[notify] in-app delivery failed:', error);
    }
  }

  if (wantsChannel(input, 'email') && emails.size > 0) {
    try {
      await EmailService.sendEmail({
        to: [...emails],
        subject: input.email?.subject ?? `[Studio] ${input.title}`,
        html: input.email?.html ?? `<p>${input.body}</p>`,
        text: input.email?.text ?? input.body,
      });
      result.emailCount = emails.size;
    } catch (error) {
      console.error('[notify] email delivery failed:', error);
    }
  }

  return result;
}

/**
 * Convenience: notify a single recipient (worker record or anonymous email).
 * `userId`/`email` may each be undefined; the available channel(s) are used.
 */
export async function notifyOne(
  recipient: NotificationRecipient,
  message: Omit<NotificationInput, 'recipients'>,
): Promise<NotificationResult> {
  return notify({ ...message, recipients: [recipient] });
}
