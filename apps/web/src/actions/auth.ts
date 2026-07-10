'use server';

// Auth is Firebase (client SDK + session cookie). Password reset and sign-out
// are handled client-side via Firebase Auth.

export async function signOutUser() {
  // Client-side Firebase sign-out handles session cleanup.
  // Placeholder for any future server-side cleanup.
  return { success: true };
}
