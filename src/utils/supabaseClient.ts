import { createClient } from '@supabase/supabase-js';
import { isDev } from './';

const supabaseEnv = {
  local: {
    supabaseUrl: process.env.LOCALE_SUPABASE_URL,
    supabaseAnonKey: process.env.LOCALE_SUPABASE_ANON_KEY,
  },
  stg: {
    supabaseUrl: process.env.STG_SUPABASE_URL,
    supabaseAnonKey: process.env.STG_SUPABASE_ANON_KEY,
  },
  prod: {
    supabaseUrl: process.env.PROD_SUPABASE_URL,
    supabaseAnonKey: process.env.PROD_SUPABASE_ANON_KEY,
  },
};

const { supabaseUrl } = supabaseEnv[isDev() ? 'local' : 'prod'];
const { supabaseAnonKey } = supabaseEnv[isDev() ? 'local' : 'prod'];

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export { supabaseUrl, supabaseAnonKey, supabase };
