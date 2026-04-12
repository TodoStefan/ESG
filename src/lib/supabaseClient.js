import { createClient } from '@supabase/supabase-js';

// Configure these in .env (see .env.example)
const normalizeEnvValue = (value) => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';

  // tolerate copied values with quotes
  const quoted = trimmed.match(/^(["'])(.*)\1$/);
  return quoted ? quoted[2].trim() : trimmed;
};

const resolveSupabaseUrl = () => normalizeEnvValue(import.meta.env.VITE_SUPABASE_URL || '');

const resolveSupabaseKey = () =>
  normalizeEnvValue(
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      ''
  );

const supabaseUrl = resolveSupabaseUrl();
const supabaseAnonKey = resolveSupabaseKey();

// If credentials are not provided (e.g. initial setup offline), we fallback gracefully
export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

export const supabaseConfigInfo = {
  hasConfig: hasSupabaseConfig,
  hasUrl: Boolean(supabaseUrl),
  hasKey: Boolean(supabaseAnonKey),
  supportedKeyVars: ['VITE_SUPABASE_ANON_KEY', 'VITE_SUPABASE_PUBLISHABLE_KEY'],
  missingVars: [
    ...(!supabaseUrl ? ['VITE_SUPABASE_URL'] : []),
    ...(!supabaseAnonKey
      ? ['VITE_SUPABASE_ANON_KEY oder VITE_SUPABASE_PUBLISHABLE_KEY']
      : []),
  ],
};

let client = null;

if (hasSupabaseConfig) {
  client = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = client;
