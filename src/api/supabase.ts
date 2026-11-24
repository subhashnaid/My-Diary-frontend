import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mdeivytkhjpdrikutupn.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_LDRmWnVy_PmqPPtnBhVS2Q_GaOFguD1';

export const supabase = createClient(supabaseUrl, supabaseKey);
