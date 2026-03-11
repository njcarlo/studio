import dotenv from 'dotenv';
import path from 'path';
import { adminAuth } from './src/lib/firebase-admin';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function checkUser() {
  const email = 'njcarlo@gmail.com';
  try {
    const user = await adminAuth().getUserByEmail(email);
    console.log(`User found: ${user.uid}`);
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      console.log(`User ${email} not found.`);
    } else {
      console.error('Error checking user:', error);
    }
  }
}

checkUser();
