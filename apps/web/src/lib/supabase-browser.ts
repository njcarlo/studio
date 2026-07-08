// Re-exports the shared @studio/database browser client singleton instead of
// instantiating a second createBrowserClient — this file previously created
// its own client with the same URL/anon key, duplicating packages/database's
// supabase-client.ts for no reason (Firebase migration plan §11 Phase 0
// client consolidation).
export { supabase as supabaseBrowser } from '@studio/database';
