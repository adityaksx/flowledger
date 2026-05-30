/**
 * supabase.js — Supabase client initialisation
 *
 * HOW TO SET YOUR KEYS:
 *   1. Go to supabase.com → your project → Settings → API
 *   2. Copy "Project URL" → paste into SUPABASE_URL below
 *   3. Copy "anon public" key → paste into SUPABASE_ANON_KEY below
 *   4. That's it. No server needed. RLS handles security.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL      = "https://jvvfpxeigrsmujzquyyg.supabase.co";   // ← paste here
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2dmZweGVpZ3JzbXVqenF1eXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNTU2ODEsImV4cCI6MjA5NTczMTY4MX0.2lc5oAJRGHZMbuMfY7QYJRr25Vh-FY-kVQl2U3kSxhY";                   // ← paste here

if (SUPABASE_URL.includes("YOUR_PROJECT_ID")) {
  console.warn(
    "[FlowLedger] Supabase keys not set. Open js/supabase.js and add your project URL and anon key."
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession:    true,
    autoRefreshToken:  true,
    detectSessionInUrl: true,
  },
});

/** Expose on window so legacy inline scripts can reach it */
window.flowledgerSupabase = supabase;

export default supabase;
