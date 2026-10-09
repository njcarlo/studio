'use server';

import { headers } from 'next/headers';
import { prisma } from '@studio/database/prisma';
import { getSupabaseAdminClient } from '@/lib/supabase-admin';
import { NotificationService } from '@/services/notification-service';
import { validateLoginIdentifier } from '@/actions/legacy-auth';

const DEFAULT_PRODUCTION_URL = 'https://cogapp.vercel.app';

/**
 * Resolves the absolute application base URL.
 * Handles production Vercel domains, request headers, and fallback origins.
 */
async function resolveAppUrl(providedOrigin?: string): Promise<string> {
  // If providedOrigin is already an external/production URL (not localhost), prioritize it
  if (providedOrigin && !providedOrigin.includes('localhost') && !providedOrigin.includes('127.0.0.1')) {
    return providedOrigin.replace(/\/$/, '');
  }

  // Check request headers (e.g. from Vercel deployment)
  try {
    const headerList = await headers();
    const host = headerList.get('x-forwarded-host') || headerList.get('host');
    const proto = headerList.get('x-forwarded-proto') || 'https';
    if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
      return `${proto}://${host}`.replace(/\/$/, '');
    }
  } catch {
    // Ignore header resolution errors
  }

  // Check VERCEL_PROJECT_PRODUCTION_URL or VERCEL_URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, '');
  }

  // Check NEXT_PUBLIC_APP_URL
  if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }

  // If in production or on Vercel, always default to the live production URL
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    return DEFAULT_PRODUCTION_URL;
  }

  // Fallback to provided origin (e.g. localhost during local development)
  if (providedOrigin) {
    return providedOrigin.replace(/\/$/, '');
  }

  return DEFAULT_PRODUCTION_URL;
}

/**
 * Requests a password reset link and sends it directly via Church of God Gmail SMTP
 * (churchofgoddasmarinas@gmail.com) instead of Supabase Auth's default mailer.
 */
export async function requestPasswordReset(identifier: string, origin?: string) {
  try {
    const clean = (identifier || '').trim();
    if (!clean) {
      return { success: false, error: 'Please enter your email or Worker ID.' };
    }

    // 1. Resolve identifier and check active status
    const validation = await validateLoginIdentifier(clean, clean.includes('@') ? 'email' : 'worker');
    if (!validation.success) {
      return {
        success: false,
        isDeactivated: validation.isDeactivated,
        error: validation.error || 'Failed to verify account.',
      };
    }

    const email = (validation.email || clean).trim();

    // 2. Fetch worker display name
    const worker = await prisma.worker.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { firstName: true, lastName: true, status: true },
    });

    if (worker && worker.status !== 'Active') {
      return {
        success: false,
        isDeactivated: true,
        error: 'Your account is deactivated. Please contact your administrator.',
      };
    }

    const workerName = worker ? `${worker.firstName} ${worker.lastName}`.trim() : undefined;

    // 3. Generate secure recovery link using Supabase Admin
    const supabaseAdmin = getSupabaseAdminClient();
    const appUrl = await resolveAppUrl(origin);
    const redirectTo = `${appUrl}/auth/update-password`;

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo,
      },
    });

    if (linkError || !linkData?.properties) {
      console.error('generateLink error:', linkError);
      return {
        success: false,
        error: linkError?.message || 'Could not generate password reset link. Please verify the email.',
      };
    }

    // Prefer direct link with token_hash so it bypasses Supabase redirect stripping (which resets to localhost:3000)
    const resetLink = linkData.properties.hashed_token
      ? `${appUrl}/auth/update-password?token_hash=${linkData.properties.hashed_token}&type=recovery`
      : linkData.properties.action_link;

    // 4. Send via Church of God Gmail SMTP
    await NotificationService.sendPasswordResetEmail(email, resetLink, workerName);

    return { success: true, email };
  } catch (error: any) {
    console.error('requestPasswordReset error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to send password reset email. Please try again.',
    };
  }
}

export async function signOutUser() {
  return { success: true };
}
