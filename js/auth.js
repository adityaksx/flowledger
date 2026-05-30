/**
 * auth.js — All auth helpers used across index, login, and app pages.
 * Uses supabase.auth.* — runs entirely client-side via RLS.
 */

import { supabase } from "./supabase.js";

/* ── Sign in ─────────────────────────────────────────────────────────────── */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

/* ── Sign up ─────────────────────────────────────────────────────────────── */
export async function signUp(email, password, name, currency = "INR") {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, currency },
    },
  });
  if (error) throw error;

  // If email confirmation is disabled in Supabase dashboard, session is live now.
  // If enabled, data.session will be null — show "check your email" message.
  if (data.session) {
    await ensureProfile(data.user, name, currency);
  }
  return { user: data.user, session: data.session };
}

/* ── Sign out ────────────────────────────────────────────────────────────── */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/* ── Get current session ─────────────────────────────────────────────────── */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

/* ── Get current user ────────────────────────────────────────────────────── */
export async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

/* ── Listen to auth state changes ───────────────────────────────────────── */
export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
}

/* ── Ensure a profile row exists after first login ──────────────────────── */
export async function ensureProfile(user, name, currency = "INR") {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!existing) {
    await supabase.from("profiles").insert({
      id:       user.id,
      name:     name || user.user_metadata?.name || "User",
      currency: currency || user.user_metadata?.currency || "INR",
    });
  }
}

/* ── Redirect guard (call at top of app.html) ───────────────────────────── */
export async function requireAuth(redirectTo = "./login.html") {
  const session = await getSession();
  if (!session) {
    window.location.replace(redirectTo);
    return null;
  }
  return session;
}
