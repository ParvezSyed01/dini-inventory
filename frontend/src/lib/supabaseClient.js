import { createClient } from '@supabase/supabase-js';
import { Preferences } from '@capacitor/preferences'; // 👈 1. Add this native import

const clean = (value) =>
  String(value ?? '')
    .trim()
    .replace(/^["']|["']$/g, '');

const supabaseUrl = clean(import.meta.env.VITE_SUPABASE_URL || "https://supabase.co");
const supabaseAnonKey = clean(import.meta.env.VITE_SUPABASE_ANON_KEY || "your-actual-long-public-anon-key-string");

// 2. Build a native storage adapter to bypass browser storage restrictions
const capacitorStorageAdapter = {
  getItem: async (key) => {
    const { value } = await Preferences.get({ key });
    return value;
  },
  setItem: async (key, value) => {
    await Preferences.set({ key, value });
  },
  removeItem: async (key) => {
    await Preferences.remove({ key });
  }
};

// 3. Inject the storage rules into the client constructor
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: capacitorStorageAdapter, // 👈 Redirects session tokens to native storage
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false // Disables browser deep-linking logic on mobile
  }
});
