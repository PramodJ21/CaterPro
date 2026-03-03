import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jvuxdyihbzqfdpbdbacm.supabase.co';
const supabaseKey = 'sb_publishable_52lRYbP0AWEsGcNcE9fflQ_07PxqTiD';
export const supabase = createClient(supabaseUrl, supabaseKey);
