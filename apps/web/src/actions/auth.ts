'use server';

// Password reset is now handled client-side via supabase.auth.resetPasswordForEmail()
// in the login page. This file is kept for any future server-side auth actions.

export async function signOutUser() {
  // Supabase sign-out is handled client-side via supabase.auth.signOut()
  // This is a placeholder for any server-side cleanup needed in the future.
  return { success: true };
}
