import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export function createClient() {
    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Supabase URL or Anon Key is missing. Check your .env.local file.');
    }
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Singleton for client-side usage
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabase() {
    if (!browserClient) {
        browserClient = createClient();
    }
    return browserClient;
}
