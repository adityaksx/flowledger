/**
 * router.js — Simple hash-based SPA router
 * Usage: import { router } from "./router.js"; router.init();
 */

const ROUTES = {
  dashboard:    { title: "Dashboard",    subtitle: "Your money overview at a glance." },
  accounts:     { title: "Accounts",     subtitle: "Track balances across all accounts." },
  transactions: { title: "Transactions", subtitle: "Income, expense, and transfer history." },
  reimburse:    { title: "Reimburse",    subtitle: "Track money others still owe you." },
  ledger:       { title: "Ledger",       subtitle: "Manage long-term borrow and lend." },
  recurring:    { title: "Recurring",    subtitle: "Bills, subscriptions, and reminders." },
  reports:      { title: "Reports",      subtitle: "Trends, category totals, and CSV export." },
  settings:     { title: "Settings",     subtitle: "Profile, categories, and preferences." },
};

function current() {
  const raw = location.hash.replace("#", "").trim();
  return ROUTES[raw] ? raw : "dashboard";
}

function render() {
  const route = current();
  const meta  = ROUTES[route];

  const pageTitle    = document.getElementById("pageTitle");
  const pageSubtitle = document.getElementById("pageSubtitle");
  if (pageTitle)    pageTitle.textContent    = meta.title;
  if (pageSubtitle) pageSubtitle.textContent = meta.subtitle;

  document.querySelectorAll("[data-view]").forEach(el => {
    el.classList.toggle("active", el.dataset.view === route);
  });

  document.querySelectorAll("[data-route]").forEach(el => {
    el.classList.toggle("active", el.dataset.route === route);
  });

  const fab = document.getElementById("fabButton");
  if (fab) {
    const labels = {
      accounts: "＋ Account", transactions: "＋ Entry",
      reimburse: "＋ Reimburse", ledger: "＋ Ledger",
      recurring: "＋ Rule", reports: "Export", settings: "Edit"
    };
    fab.textContent = labels[route] || "＋ Add";
  }

  document.body.classList.remove("sidebar-open");

  // Fire event so feature modules can react
  window.dispatchEvent(new CustomEvent("routechange", { detail: { route } }));
}

export const router = {
  init() {
    window.addEventListener("hashchange", render);
    render();
  },
  go(route) {
    location.hash = route;
  },
  current,
};
