'use server';

import { adminAuth } from '@/lib/firebase-admin';
import { NotificationService } from '@/services/notification-service';

export async function requestPasswordReset(email: string) {
  if (!email) {
    return { success: false, error: 'Email is required' };
  }

  try {
    // 1. Generate the reset link via Firebase Admin
    // This allows us to send the link via our own Resend-powered Email Service
    const link = await adminAuth().generatePasswordResetLink(email, {
      url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002/login',
    });

    // 2. Send the email via Resend
    await NotificationService.sendPasswordResetEmail(email, link);

    return { success: true };
  } catch (error: any) {
    console.error('Password reset action error:', error);
    
    // Return user-friendly error messages if possible
    if (error.code === 'auth/user-not-found') {
      // For security, we might want to return success: true even if user not found,
      // but in a studio app, it's often better to be explicit.
      return { success: false, error: 'User not found' };
    }
    
    return { success: false, error: 'Failed to request password reset' };
  }
}
