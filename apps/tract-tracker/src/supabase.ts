import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vpgykxfbrfnojmgmzriq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwZ3lreGZicmZub2ptZ216cmlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNDg4NjMsImV4cCI6MjA4ODcyNDg2M30.mUTWubXZxKcWmPFhYaDuVef5oYs9fgDRFo0yD1dgHa8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
