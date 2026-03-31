import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nwufkntgqrvbtgrsbldw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_M1E92lrwu9suWYGKbDMegQ_3rMY5_L1';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
