/**
 * state.js — Central in-memory app state.
 * All DB reads hydrate this object. All writes go to Supabase, then refresh state.
 */

export const state = {
  user:            null,   // { id, email, name, currency }
  accounts:        [],     // [{ id, name, emoji, type, balance }]
  categories:      [],     // [{ id, name, emoji, type }]
  transactions:    [],     // [{ id, account_id, category_id, amount, type, date, remarks }]
  reimbursements:  [],     // [{ id, person_name, total_amount, paid_back, status }]
  ledgerPeople:    [],     // [{ id, person_name, net_balance }]
  recurringRules:  [],     // [{ id, title, amount, frequency, next_due }]
};

/** Replace a slice of state and dispatch a custom event so views can react */
export function setState(slice, value) {
  state[slice] = value;
  window.dispatchEvent(new CustomEvent("statechange", { detail: { slice, value } }));
}
