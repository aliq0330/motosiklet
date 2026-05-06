import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

let _client = null;

export function getSupabase() {
  if (!_client) {
    if (typeof supabase === 'undefined') {
      console.error('Supabase SDK yüklenemedi');
      return null;
    }
    _client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: { eventsPerSecond: 10 }
      }
    });
  }
  return _client;
}

export const db = {
  from: (table) => getSupabase()?.from(table),
  auth: () => getSupabase()?.auth,
  storage: () => getSupabase()?.storage,
  channel: (name) => getSupabase()?.channel(name),
  removeChannel: (ch) => getSupabase()?.removeChannel(ch)
};
