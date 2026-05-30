/**
 * login.js — All logic for the login/register page.
 * Imports from supabase.js and auth.js.
 * No inline scripts needed in login.html.
 */

import { signIn, signUp } from "./auth.js";

/* ══════════════════════════════════════════════════════════════
   THEME TOGGLE
══════════════════════════════════════════════════════════════ */
const root     = document.documentElement;
const themeBtn = document.getElementById("themeBtn");
const themeIcon = document.getElementById("themeIcon");

const SUN_SVG  = `<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>`;
const MOON_SVG = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79"/>`;

let theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

function applyTheme(t) {
  root.setAttribute("data-theme", t);
  themeIcon.innerHTML = t === "dark" ? SUN_SVG : MOON_SVG;
}

applyTheme(theme);

themeBtn.addEventListener("click", () => {
  theme = theme === "dark" ? "light" : "dark";
  applyTheme(theme);
});


/* ══════════════════════════════════════════════════════════════
   TAB SWITCHER
══════════════════════════════════════════════════════════════ */
const tabLogin     = document.getElementById("tab-login");
const tabRegister  = document.getElementById("tab-register");
const panelLogin   = document.getElementById("panel-login");
const panelReg     = document.getElementById("panel-register");

function activateTab(tab) {
  const isLogin = tab === "login";

  tabLogin.classList.toggle("active", isLogin);
  tabRegister.classList.toggle("active", !isLogin);
  tabLogin.setAttribute("aria-selected", String(isLogin));
  tabRegister.setAttribute("aria-selected", String(!isLogin));

  panelLogin.classList.toggle("hidden", !isLogin);
  panelReg.classList.toggle("hidden", isLogin);
}

tabLogin.addEventListener("click",    () => activateTab("login"));
tabRegister.addEventListener("click", () => activateTab("register"));
document.getElementById("goRegister").addEventListener("click", () => activateTab("register"));
document.getElementById("goLogin").addEventListener("click",    () => activateTab("login"));


/* ══════════════════════════════════════════════════════════════
   PASSWORD VISIBILITY TOGGLES
══════════════════════════════════════════════════════════════ */
const EYE_OPEN = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
const EYE_SHUT = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`;

function setupEyeToggle(btnId, inputId, iconId) {
  const btn   = document.getElementById(btnId);
  const input = document.getElementById(inputId);
  const icon  = document.getElementById(iconId);
  let visible = false;

  btn.addEventListener("click", () => {
    visible = !visible;
    input.type = visible ? "text" : "password";
    icon.innerHTML = visible ? EYE_SHUT : EYE_OPEN;
    btn.setAttribute("aria-label", visible ? "Hide password" : "Show password");
  });
}

setupEyeToggle("loginEyeBtn", "loginPassword", "loginEyeIcon");
setupEyeToggle("regEyeBtn",   "regPassword",   "regEyeIcon");


/* ══════════════════════════════════════════════════════════════
   PASSWORD STRENGTH METER
══════════════════════════════════════════════════════════════ */
const regPasswordInput = document.getElementById("regPassword");
const pwStrengthEl     = document.getElementById("pwStrength");
const strengthLabel    = document.getElementById("strengthLabel");
const bars             = [1, 2, 3, 4].map(i => document.getElementById("bar" + i));

const STRENGTH_LEVELS = [
  { label: "Too short",  cls: "s1" },
  { label: "Weak",       cls: "s1" },
  { label: "Fair",       cls: "s2" },
  { label: "Good",       cls: "s3" },
  { label: "Strong 💪",  cls: "s4" },
];

function scorePassword(pw) {
  if (pw.length < 8) return 0;
  let score = 1;
  if (pw.length >= 10)                             score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw))       score++;
  if (/\d/.test(pw))                               score++;
  if (/[^A-Za-z0-9]/.test(pw))                     score++;
  return Math.min(score, 4);
}

regPasswordInput.addEventListener("input", () => {
  const pw = regPasswordInput.value;
  if (!pw) { pwStrengthEl.classList.add("hidden"); return; }

  pwStrengthEl.classList.remove("hidden");

  const score = scorePassword(pw);
  const level = STRENGTH_LEVELS[score];

  bars.forEach((bar, i) => {
    bar.className = "bar";
    if (i < score) bar.classList.add(level.cls);
  });

  strengthLabel.textContent = level.label;
});


/* ══════════════════════════════════════════════════════════════
   ALERT HELPERS
══════════════════════════════════════════════════════════════ */
function showError(elId, msgId, message) {
  const el = document.getElementById(elId);
  document.getElementById(msgId).textContent = message;
  el.classList.remove("hidden");
}

function hideAlert(elId) {
  document.getElementById(elId).classList.add("hidden");
}

function showSuccess(elId, msgId, message) {
  const el = document.getElementById(elId);
  document.getElementById(msgId).textContent = message;
  el.classList.remove("hidden");
}


/* ══════════════════════════════════════════════════════════════
   LOADING STATE HELPERS
══════════════════════════════════════════════════════════════ */
function setLoading(btnId, loading) {
  const btn     = document.getElementById(btnId);
  const spinner = btn.querySelector(".spinner");
  const label   = btn.querySelector(".btn-label");

  btn.disabled = loading;
  spinner.classList.toggle("hidden", !loading);
  label.classList.toggle("hidden", loading);
}


/* ══════════════════════════════════════════════════════════════
   VALIDATION
══════════════════════════════════════════════════════════════ */
function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}


/* ══════════════════════════════════════════════════════════════
   SEED DEFAULT CATEGORIES FOR NEW USER
   Called once right after signup
══════════════════════════════════════════════════════════════ */
import { supabase } from "./supabase.js";

const DEFAULT_CATEGORIES = [
  // Income
  { name: "Salary",       emoji: "💼", color: "#437a22", type: "income"  },
  { name: "Freelance",    emoji: "💻", color: "#437a22", type: "income"  },
  { name: "Gift",         emoji: "🎁", color: "#437a22", type: "income"  },
  { name: "Investment",   emoji: "📈", color: "#437a22", type: "income"  },
  { name: "Refund",       emoji: "🔄", color: "#437a22", type: "income"  },
  // Expense
  { name: "Food",         emoji: "🍔", color: "#da7101", type: "expense" },
  { name: "Transport",    emoji: "🚗", color: "#da7101", type: "expense" },
  { name: "Shopping",     emoji: "🛒", color: "#da7101", type: "expense" },
  { name: "Rent",         emoji: "🏠", color: "#da7101", type: "expense" },
  { name: "Health",       emoji: "💊", color: "#da7101", type: "expense" },
  { name: "Education",    emoji: "📚", color: "#006494", type: "expense" },
  { name: "Entertainment",emoji: "🎬", color: "#006494", type: "expense" },
  { name: "Utilities",    emoji: "⚡", color: "#006494", type: "expense" },
  { name: "Clothing",     emoji: "👗", color: "#006494", type: "expense" },
  { name: "Travel",       emoji: "✈️", color: "#006494", type: "expense" },
];

async function seedCategories(userId) {
  const rows = DEFAULT_CATEGORIES.map(c => ({
    ...c,
    user_id:    userId,
    is_default: true,
  }));
  await supabase.from("categories").insert(rows);
}


/* ══════════════════════════════════════════════════════════════
   LOGIN FORM SUBMIT
══════════════════════════════════════════════════════════════ */
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAlert("loginError");

  const email    = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (!isValidEmail(email)) {
    showError("loginError", "loginErrorMsg", "Please enter a valid email address.");
    return;
  }
  if (!password) {
    showError("loginError", "loginErrorMsg", "Please enter your password.");
    return;
  }

  setLoading("loginBtn", true);

  try {
    await signIn(email, password);
    window.location.href = "./app.html";
  } catch (err) {
    showError("loginError", "loginErrorMsg",
      err.message === "Invalid login credentials"
        ? "Wrong email or password. Please try again."
        : err.message || "Sign in failed. Please try again."
    );
    setLoading("loginBtn", false);
  }
});


/* ══════════════════════════════════════════════════════════════
   REGISTER FORM SUBMIT
══════════════════════════════════════════════════════════════ */
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAlert("registerError");
  hideAlert("registerSuccess");

  const name     = document.getElementById("regName").value.trim();
  const email    = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;
  const currency = document.getElementById("regCurrency").value;

  if (!name) {
    showError("registerError", "registerErrorMsg", "Please enter your name."); return;
  }
  if (!isValidEmail(email)) {
    showError("registerError", "registerErrorMsg", "Please enter a valid email."); return;
  }
  if (password.length < 8) {
    showError("registerError", "registerErrorMsg", "Password must be at least 8 characters."); return;
  }

  setLoading("registerBtn", true);

  try {
    const { user, session } = await signUp(email, password, name, currency);

    if (!session) {
      // Supabase email confirmation is ON — user needs to verify first
      showSuccess(
        "registerSuccess",
        "registerSuccessMsg",
        "✅ Account created! Check your email to confirm, then sign in."
      );
      setLoading("registerBtn", false);
      return;
    }

    // Session is live — seed default categories then redirect
    await seedCategories(user.id);
    showSuccess("registerSuccess", "registerSuccessMsg", "🎉 Account created! Taking you to your dashboard…");
    setTimeout(() => { window.location.href = "./app.html"; }, 1200);

  } catch (err) {
    showError("registerError", "registerErrorMsg",
      err.message || "Registration failed. Please try again."
    );
    setLoading("registerBtn", false);
  }
});


/* ══════════════════════════════════════════════════════════════
   SKIP LOGIN IF ALREADY AUTHENTICATED
══════════════════════════════════════════════════════════════ */
import { getSession } from "./auth.js";

(async () => {
  const session = await getSession();
  if (session) {
    window.location.replace("./app.html");
  }
})();
