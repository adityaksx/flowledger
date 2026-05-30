/**
 * db.js — All Supabase database read/write helpers.
 * Each function returns plain JS objects. Views import these and call setState().
 *
 * RLS enforces user_id = auth.uid() at the DB level — no server needed.
 */

import { supabase } from "./supabase.js";

// ─── PROFILES ────────────────────────────────────────────────────────────────

export async function fetchProfile() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateProfile(updates) {
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", (await supabase.auth.getUser()).data.user.id);
  if (error) throw error;
}

// ─── ACCOUNTS ────────────────────────────────────────────────────────────────

export async function fetchAccounts() {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addAccount({ name, emoji = "💳", color = "#01696f", type = "bank", opening_balance = 0 }) {
  const { data, error } = await supabase
    .from("accounts")
    .insert({ name, emoji, color, type, opening_balance })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAccount(id, updates) {
  const { error } = await supabase.from("accounts").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteAccount(id) {
  const { error } = await supabase.from("accounts").delete().eq("id", id);
  if (error) throw error;
}

// ─── CATEGORIES ──────────────────────────────────────────────────────────────

export async function fetchCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addCategory({ name, emoji = "📂", color = "#01696f", type = "expense" }) {
  const { data, error } = await supabase
    .from("categories")
    .insert({ name, emoji, color, type })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────

export async function fetchTransactions({ from, to, account_id, category_id, type } = {}) {
  let q = supabase
    .from("transactions")
    .select("*, accounts(name,emoji), categories(name,emoji)")
    .order("date", { ascending: false });

  if (from)        q = q.gte("date", from);
  if (to)          q = q.lte("date", to);
  if (account_id)  q = q.eq("account_id", account_id);
  if (category_id) q = q.eq("category_id", category_id);
  if (type)        q = q.eq("type", type);

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function addTransaction({
  account_id, category_id, amount, type,
  date, remarks = "",
  is_transfer = false, transfer_to_account_id = null,
  reimburse_id = null,
}) {
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      account_id, category_id, amount: Math.abs(amount), type,
      date: date || new Date().toISOString().slice(0, 10),
      remarks, is_transfer, transfer_to_account_id, reimburse_id,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTransaction(id, updates) {
  const { error } = await supabase.from("transactions").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteTransaction(id) {
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw error;
}

// ─── REIMBURSEMENTS ───────────────────────────────────────────────────────────

export async function fetchReimbursements() {
  const { data, error } = await supabase
    .from("reimbursements")
    .select("*, reimburse_payments(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addReimbursement({ person_name, original_txn_id, total_amount }) {
  const { data, error } = await supabase
    .from("reimbursements")
    .insert({ person_name, original_txn_id, total_amount, paid_back: 0, status: "pending" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function addReimbursePayment({ reimburse_id, amount, account_id, date, remarks = "" }) {
  const { error: payErr } = await supabase
    .from("reimburse_payments")
    .insert({ reimburse_id, amount, account_id, date: date || new Date().toISOString().slice(0, 10), remarks });
  if (payErr) throw payErr;

  // Update paid_back total
  const { data: existing } = await supabase
    .from("reimbursements")
    .select("paid_back, total_amount")
    .eq("id", reimburse_id)
    .single();
  const newPaid = (existing?.paid_back || 0) + Number(amount);
  const settled = newPaid >= (existing?.total_amount || 0);
  await supabase
    .from("reimbursements")
    .update({ paid_back: newPaid, status: settled ? "settled" : "partial" })
    .eq("id", reimburse_id);
}

// ─── LEDGER ───────────────────────────────────────────────────────────────────

export async function fetchLedgerPeople() {
  const { data, error } = await supabase
    .from("ledger_people")
    .select("*, ledger_entries(id, amount, type, date, is_settled, ledger_payments(amount))")
    .order("person_name", { ascending: true });
  if (error) throw error;
  return (data || []).map(p => {
    let net = 0;
    (p.ledger_entries || []).forEach(e => {
      if (e.is_settled) return;
      const paid = (e.ledger_payments || []).reduce((s, lp) => s + Number(lp.amount), 0);
      const remaining = Number(e.amount) - paid;
      net += e.type === "lent" ? remaining : -remaining;
    });
    return { ...p, net_balance: net };
  });
}

export async function addLedgerEntry({ person_id, amount, type, date, remarks = "" }) {
  const { data, error } = await supabase
    .from("ledger_entries")
    .insert({ person_id, amount, type, date: date || new Date().toISOString().slice(0, 10), remarks, is_settled: false })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function addLedgerPayment({ entry_id, amount, account_id, date, remarks = "" }) {
  const { error } = await supabase
    .from("ledger_payments")
    .insert({ entry_id, amount, account_id, date: date || new Date().toISOString().slice(0, 10), remarks });
  if (error) throw error;
}

// ─── RECURRING ────────────────────────────────────────────────────────────────

export async function fetchRecurring() {
  const { data, error } = await supabase
    .from("recurring_rules")
    .select("*, accounts(name,emoji), categories(name,emoji)")
    .eq("is_active", true)
    .order("next_due", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addRecurringRule({ account_id, category_id, amount, type, frequency, next_due, remarks = "" }) {
  const { data, error } = await supabase
    .from("recurring_rules")
    .insert({ account_id, category_id, amount, type, frequency, next_due, remarks, is_active: true })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function toggleRecurring(id, is_active) {
  const { error } = await supabase.from("recurring_rules").update({ is_active }).eq("id", id);
  if (error) throw error;
}

export async function deleteRecurring(id) {
  const { error } = await supabase.from("recurring_rules").delete().eq("id", id);
  if (error) throw error;
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────

export async function fetchMonthlySummary(year, month) {
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const to   = `${year}-${String(month).padStart(2, "0")}-31`;
  const { data, error } = await supabase
    .from("transactions")
    .select("amount, type, categories(name,emoji)")
    .gte("date", from)
    .lte("date", to)
    .neq("is_transfer", true);
  if (error) throw error;
  const rows = data || [];
  const income  = rows.filter(r => r.type === "income").reduce((s, r) => s + Number(r.amount), 0);
  const expense = rows.filter(r => r.type === "expense").reduce((s, r) => s + Number(r.amount), 0);

  // category breakdown
  const byCategory = {};
  rows.filter(r => r.type === "expense").forEach(r => {
    const key = r.categories?.name || "Other";
    byCategory[key] = (byCategory[key] || 0) + Number(r.amount);
  });

  return { income, expense, savings: income - expense, byCategory };
}
