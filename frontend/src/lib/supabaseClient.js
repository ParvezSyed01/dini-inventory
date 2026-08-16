import { createClient } from '@supabase/supabase-js';
import { Preferences } from '@capacitor/preferences';

const clean = (value) =>
  String(value ?? '')
    .trim()
    .replace(/^["']|["']$/g, '');

const supabaseUrl = clean(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = clean(import.meta.env.VITE_SUPABASE_ANON_KEY);

// Fail early in development/build if env variables are missing
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Supabase Configuration Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing from environment variables.'
  );
}

// Capacitor Native Storage Adapter
const capacitorStorageAdapter = {
  getItem: async (key) => {
    try {
      const { value } = await Preferences.get({ key });
      return value;
    } catch (err) {
      console.error('Error reading from Capacitor Preferences:', err);
      return null;
    }
  },
  setItem: async (key, value) => {
    try {
      await Preferences.set({ key, value });
    } catch (err) {
      console.error('Error writing to Capacitor Preferences:', err);
    }
  },
  removeItem: async (key) => {
    try {
      await Preferences.remove({ key });
    } catch (err) {
      console.error('Error removing from Capacitor Preferences:', err);
    }
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: capacitorStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});