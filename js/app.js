import { supabase } from "./supabase.js";

const { data: { session } } = await supabase.auth.getSession();
if (!session) { window.location.replace("./login.html"); }
const USER = session.user;

let accounts=[], categories=[], transactions=[], reimbursements=[], profile={};
let currentTxnType='expense', currentCatType='expense';
let currentImportKind='transactions', importRows=[], importHeaders=[];
let iconTargetInput=null;
let currentReimbTab = 'reimburse'; // 'reimburse' | 'refunded'

const ICON_BASE = 'https://raw.githubusercontent.com/adityaksx/flowledger/refs/heads/main/assets/icons/';

const ICONS = [
  { g: "accounts", k: "bank", img: "bank.png", l: "Bank" },
  { g: "accounts", k: "wallet", img: "wallet.png", l: "Wallet" },
  { g: "accounts", k: "wallet", img: "wallet_1.png", l: "Wallet" },
  { g: "accounts", k: "card", img: "card.png", l: "Card" },
  { g: "accounts", k: "cash", img: "cash.png", l: "Cash" },
  { g: "accounts", k: "cash", img: "cash_1.png", l: "Cash" },
  { g: "accounts", k: "cash", img: "cash_3.png", l: "Cash" },
  { g: "accounts", k: "cash", img: "coins.png", l: "Cash" },
  { g: "accounts", k: "stocks", img: "Stocks.png", l: "Stocks" },
  { g: "accounts", k: "gold", img: "gold.png", l: "Gold" },
  { g: "accounts", k: "safe", img: "safe.png", l: "Safe" },

  { g: "income", k: "salary", img: "salary.png", l: "Salary" },
  { g: "income", k: "bonus", img: "bonus.png", l: "Bonus" },
  { g: "income", k: "cashback", img: "cashback.png", l: "Cashback" },
  { g: "income", k: "interest", img: "interest.png", l: "Interest" },
  { g: "income", k: "refund", img: "refund.png", l: "Refund" },
  { g: "income", k: "gift", img: "gift.png", l: "Gift" },
  { g: "income", k: "freelance", img: "freelance.png", l: "Freelance" },
  { g: "income", k: "dividend", img: "dividend.png", l: "Dividend" },
  { g: "income", k: "reward", img: "reward.png", l: "Reward" },
  { g: "income", k: "deposit", img: "deposit.png", l: "Deposit" },
  { g: "income", k: "profit", img: "profit.png", l: "Profit" },
  { g: "income", k: "other income", img: "other_income.png", l: "Other income" },

  { g: "expense", k: "food", img: "food.png", l: "Food" },
  { g: "expense", k: "grocery", img: "grocery.png", l: "Grocery" },
  { g: "expense", k: "fruits", img: "fruits.png", l: "Fruits" },
  { g: "expense", k: "vegetable", img: "vegetable.png", l: "Vegetable" },
  { g: "expense", k: "dessert", img: "dessert.png", l: "Dessert" },
  { g: "expense", k: "snacks", img: "snacks.png", l: "Snacks" },
  { g: "expense", k: "auto", img: "auto.png", l: "Auto" },
  { g: "expense", k: "taxi", img: "taxi.png", l: "Taxi" },
  { g: "expense", k: "train", img: "train.png", l: "Train" },
  { g: "expense", k: "flight", img: "flight.png", l: "Flight" },
  { g: "expense", k: "fuel", img: "fuel.png", l: "Fuel" },
  { g: "expense", k: "medical", img: "medical.png", l: "Medical" },
  { g: "expense", k: "medicine", img: "medicine.png", l: "Medicine" },
  { g: "expense", k: "stationery", img: "stationery.png", l: "stationery" },
  { g: "expense", k: "shopping", img: "shopping.png", l: "Shopping" },
  { g: "expense", k: "clothes", img: "clothes.png", l: "Clothes" },
  { g: "expense", k: "rent", img: "rent.png", l: "Rent" },
  { g: "expense", k: "movie", img: "movie.png", l: "Movie" },
  { g: "expense", k: "party", img: "party.png", l: "party" },
  { g: "expense", k: "bill", img: "bill.png", l: "Bill" },
  { g: "expense", k: "recharge", img: "recharge.png", l: "Recharge" },
  { g: "expense", k: "cloud", img: "cloud.png", l: "Cloud" },
  { g: "expense", k: "internet", img: "internet.png", l: "Internet" },
  { g: "expense", k: "ott", img: "ott.png", l: "OTT" },
  { g: "expense", k: "music", img: "music.png", l: "Music" },
  { g: "expense", k: "gaming", img: "gaming.png", l: "Gaming" },
  { g: "expense", k: "subscription", img: "subscription.png", l: "Subscription" },
  { g: "expense", k: "home", img: "home.png", l: "Home" },
  { g: "expense", k: "cleaning", img: "cleaning.png", l: "Cleaning" },
  { g: "expense", k: "repair", img: "repair.png", l: "Repair" },
  { g: "expense", k: "withdraw", img: "withdraw.png", l: "Withdraw" },
  { g: "expense", k: "tax", img: "tax.png", l: "Tax" },
  { g: "expense", k: "gym", img: "gym.png", l: "Gym" },
  { g: "expense", k: "misc", img: "misc.png", l: "Misc" },
];

const ROUTES = {
  dashboard:    { title:'Dashboard',    sub:'Your money overview at a glance.' },
  accounts:     { title:'Accounts',     sub:'All wallets, bank accounts, cash, cards.' },
  transactions: { title:'Transactions', sub:'Income, expense, and transfer history.' },
  reimburse:    { title:'Reimburse',    sub:'Track money you paid for others.' },
  ledger:       { title:'Ledger',       sub:'Long-term lend and borrow per person.' },
  recurring:    { title:'Recurring',    sub:'Bills, subscriptions, salary reminders.' },
  reports:      { title:'Reports',      sub:'Monthly trends and category breakdown.' },
  settings:     { title:'Settings',     sub:'Profile, categories, and preferences.' },
};

const $ = id => document.getElementById(id);
const today = () => new Date().toISOString().slice(0, 10);
const route = () => ROUTES[location.hash.replace('#','')] ? location.hash.replace('#','') : 'dashboard';
const sym   = c => ({USD:'$', EUR:'€', GBP:'£'}[c] || '₹');
const fmt   = (n, c='₹') => c + Number(n||0).toLocaleString('en-IN', {minimumFractionDigits:0, maximumFractionDigits:2});

function norm(s) { return String(s||'').trim().replace(/\s+/g,' ').toLowerCase(); }

function iconHTML(val, fallback='💳') {
  if (!val) return fallback;
  if (String(val).startsWith('http')) return `<img src="${val}" alt="" style="width:28px;height:28px;object-fit:contain;" />`;
  return val;
}

function toast(msg) {
  let t = $('toast');
  if (!t) { t=document.createElement('div'); t.id='toast'; t.style.cssText='position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#28251d;color:#f9f8f4;padding:10px 20px;border-radius:999px;font-size:14px;font-weight:600;z-index:9999;display:none'; document.body.appendChild(t); }
  t.textContent = msg; t.style.display='block'; clearTimeout(toast._t); toast._t = setTimeout(() => t.style.display='none', 2400);
}
function openModal(id)  { $(id).classList.remove('hidden'); }
function closeModal(id) { $(id).classList.add('hidden'); }

function showSkippedPopup(skippedAccounts, skippedDupeRows, skippedNoAmount) {
  let existing = document.getElementById('skippedPopup');
  if (existing) existing.remove();
  const lines = [];
  if (skippedAccounts.length) {
    const unique = [...new Set(skippedAccounts)];
    lines.push(`<b>⚠️ ${skippedAccounts.length} row${skippedAccounts.length>1?'s':''} skipped — account not registered:</b>`);
    lines.push(`<ul style="margin:8px 0 0 0;padding-left:18px;text-align:left">${unique.map(a=>`<li>${a}</li>`).join('')}</ul>`);
    lines.push(`<div style="margin-top:6px;font-size:12px;opacity:0.7">Add these accounts in Settings → Accounts, then re-import.</div>`);
  }
  if (skippedDupeRows.length) {
    lines.push(`<b style="display:block;margin-top:${skippedAccounts.length?'14px':'0'}">🔁 ${skippedDupeRows.length} duplicate row${skippedDupeRows.length>1?'s':''} skipped:</b>`);
    const rowsHtml = skippedDupeRows.map(r => {
      const sign = r.type === 'income' ? '+' : r.type === 'transfer' ? '' : '-';
      const color = r.type === 'income' ? '#22c55e' : r.type === 'transfer' ? '#f97316' : '#ef4444';
      const remark = r.remarks ? ` · ${r.remarks}` : '';
      return `<li style="margin-bottom:4px"><span style="color:${color};font-weight:700">${sign}₹${r.amount}</span> &nbsp;<span style="opacity:0.8">${r.date}</span> &nbsp;<span>${r.account}</span>${remark ? `<br><span style="font-size:11px;opacity:0.6;padding-left:2px">${remark}</span>` : ''}</li>`;
    }).join('');
    lines.push(`<ul style="margin:8px 0 0 0;padding-left:18px;text-align:left;font-size:13px">${rowsHtml}</ul>`);
    lines.push(`<div style="margin-top:6px;font-size:12px;opacity:0.6">These already exist in your transactions and were not re-added.</div>`);
  }
  if (skippedNoAmount) lines.push(`<div style="margin-top:${skippedDupeRows.length||skippedAccounts.length?'10px':'0'}">🚫 ${skippedNoAmount} row${skippedNoAmount>1?'s':''} skipped (zero/missing amount).</div>`);
  if (!lines.length) return;
  const popup = document.createElement('div');
  popup.id = 'skippedPopup';
  popup.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--card);color:var(--text);padding:24px 28px;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,0.35);z-index:10000;max-width:400px;width:92%;text-align:center;font-size:14px;line-height:1.6;max-height:80vh;overflow-y:auto';
  popup.innerHTML = lines.join('') + `<br><button onclick="document.getElementById('skippedPopup').remove()" style="margin-top:16px;padding:8px 24px;border-radius:999px;border:none;background:var(--accent);color:#fff;font-weight:700;cursor:pointer;font-size:14px">OK</button>`;
  document.body.appendChild(popup);
}

function parseDate(v) {
  if (!v) return today();
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const parts = s.split(/[\/\-]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) return s;
    const fmt = $('importDateFormat') ? $('importDateFormat').value : 'dd/mm/yyyy';
    if (fmt === 'mm/dd/yyyy') return `${parts[2]}-${parts[0].padStart(2,'0')}-${parts[1].padStart(2,'0')}`;
    return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
  }
  return s;
}

function dedupeKey(o) { return [o.date, o.amount, o.type, o.account_id||'', o.transfer_to_account_id||'', o.remarks||''].join('|'); }

async function loadAll() {
  const uid = USER.id;
  const [r1,r2,r3,r4,r5] = await Promise.all([
    supabase.from('accounts').select('*').eq('user_id',uid).eq('is_archived',false).order('created_at'),
    supabase.from('categories').select('*').eq('user_id',uid).order('type').order('name'),
    supabase.from('transactions').select('*').eq('user_id',uid).order('date',{ascending:false}).order('created_at',{ascending:false}).limit(3000),
    supabase.from('reimbursements').select('*').eq('user_id',uid).order('created_at',{ascending:false}),
    supabase.from('profiles').select('*').eq('id',uid).maybeSingle(),
  ]);
  accounts = r1.data || [];
  categories = r2.data || [];
  transactions = r3.data || [];
  reimbursements = r4.data || [];
  profile = r5.data || {};
}

function accountBalance(id) {
  const acc = accounts.find(a => a.id === id);
  let bal = Number(acc?.opening_balance || 0);
  for (const t of transactions) {
    if (t.is_transfer) {
      if (t.account_id === id) bal -= Number(t.amount);
      if (t.transfer_to_account_id === id) bal += Number(t.amount);
    } else if (t.account_id === id) {
      bal += t.type === 'income' ? Number(t.amount) : -Number(t.amount);
    }
  }
  return bal;
}

function monthTxns() {
  const ym = new Date().toISOString().slice(0,7);
  return transactions.filter(t => t.date && t.date.startsWith(ym));
}

function accSelect(id, label='Select account') {
  const s = $(id); if (!s) return;
  s.innerHTML = `<option value="">${label}</option>` + accounts.map(a => `<option value="${a.id}">${iconHTML(a.emoji, '💳')} ${a.name}</option>`).join('');
}
function catSelect(id, type='expense') {
  const s = $(id); if (!s) return;
  s.innerHTML = '<option value="">No category</option>' + categories.filter(c => c.type===type).map(c => `<option value="${c.id}">${iconHTML(c.emoji, '📂')} ${c.name}</option>`).join('');
}

function findAccount(name) {
  const n = norm(name);
  if (!n) return null;
  return accounts.find(a => norm(a.name) === n)
      || accounts.find(a => norm(a.name).includes(n))
      || accounts.find(a => n.includes(norm(a.name)))
      || null;
}

function findCategory(name, type) {
  const n = norm(name);
  if (!n) return null;
  return categories.find(c => c.type===type && norm(c.name) === n)
      || categories.find(c => c.type===type && norm(c.name).includes(n))
      || categories.find(c => c.type===type && n.includes(norm(c.name)))
      || null;
}

function txnHTML(t) {
  const cat = categories.find(c => c.id === t.category_id);
  const acc = accounts.find(a => a.id === t.account_id);
  const to  = accounts.find(a => a.id === t.transfer_to_account_id);
  const type = t.is_transfer ? 'transfer' : t.type;
  const icon = t.is_transfer ? '🔄' : iconHTML(cat?.emoji, '💸');
  const label = t.is_transfer ? `${acc?.name||'?'} → ${to?.name||'?'}` : (cat?.name || 'Uncategorised');
  const sub = [acc?.name, t.remarks].filter(Boolean).join(' · ');
  const sign = t.is_transfer ? '' : (t.type==='income' ? '+' : '-');
  const cls = type==='income' ? 'green' : type==='expense' ? 'red' : 'orange';
  return `<div class="txn-item">
  <div class="ico-circle">${icon}</div>
  <div class="txn-meta"><div class="txn-cat">${label}</div><div class="txn-sub">${sub}</div></div>
  <div class="txn-right"><div class="${cls}">${sign}${fmt(t.amount)}</div><div class="txn-sub">${t.date}</div></div>
  <div class="txn-actions">
  <button class="btn-sm" onclick="editTransaction('${t.id}')">Edit</button>
  <button class="btn-danger" onclick="deleteTransaction('${t.id}')">Delete</button>
  </div>
  </div>`;
}

function renderProfile() {
  const name = profile.name || USER.email?.split('@')[0] || 'User';
  $('userName').textContent = name;
  $('userEmail').textContent = USER.email || '';
  $('userAvatar').textContent = name[0].toUpperCase();
  if ($('settingName')) $('settingName').value = name;
  if ($('settingCurrency')) $('settingCurrency').value = profile.currency || 'INR';
}

function renderIconGrid() {
  const q = ($('iconSearch')?.value || '').trim().toLowerCase();
  const g = document.querySelector('#iconTabRow .active')?.dataset.iconGroup || 'all';
  const items = ICONS.filter(x => g==='all' || x.g===g).filter(x => !q || x.l.toLowerCase().includes(q) || x.k.toLowerCase().includes(q));
  $('iconGrid').innerHTML = items.map(x =>
  `<button type="button" class="icon-chip" data-icon="${ICON_BASE}${x.img}">
  <img src="${ICON_BASE}${x.img}" alt="${x.l}" style="width:36px;height:36px;object-fit:contain;" />
  <span class="lbl">${x.l}</span>
  </button>`
  ).join('');
  $('iconGrid').querySelectorAll('.icon-chip').forEach(b => b.onclick = () => {
    if (iconTargetInput) iconTargetInput.value = b.dataset.icon;
    closeModal('iconPickerModal');
  });
}

window.openIconPicker = function(id) {
  iconTargetInput = $(id);
  $('iconSearch').value = '';
  document.querySelector('#iconTabRow .active')?.classList.remove('active');
  document.querySelector('[data-icon-group="all"]')?.classList.add('active');
  renderIconGrid();
  openModal('iconPickerModal');
};

function render() {
  const r = route(), meta = ROUTES[r];
  $('pageTitle').textContent = meta.title;
  $('pageSub').textContent = meta.sub;
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.dataset.view === r));
  document.querySelectorAll('[data-route]').forEach(a => a.classList.toggle('active', a.dataset.route === r));
  document.body.classList.remove('sidebar-open');

  if (r === 'dashboard') renderDashboard();
  if (r === 'accounts') renderAccounts();
  if (r === 'transactions') renderTransactions();
  if (r === 'reimburse') renderReimburse();
  if (r === 'reports') renderReports();
  if (r === 'settings') renderSettings();
  if (r === 'ledger') $('ledgerList').innerHTML = '<div class="empty-state">No ledger entries yet.</div>';
  if (r === 'recurring') $('recurringList').innerHTML = '<div class="empty-state">No recurring rules yet.</div>';
}

function renderDashboard() {
  const total = accounts.reduce((s,a) => s + accountBalance(a.id), 0);
  const mt = monthTxns();
  const income = mt.filter(t => t.type==='income' && !t.is_transfer).reduce((s,t) => s+Number(t.amount), 0);
  const expense = mt.filter(t => t.type==='expense' && !t.is_transfer).reduce((s,t) => s+Number(t.amount), 0);
  const due = reimbursements.filter(x => x.status!=='settled').reduce((s,x) => s+(Number(x.total_amount)-Number(x.paid_back||0)), 0);
  $('kpiBalance').textContent = fmt(total);
  $('kpiIncome').textContent = fmt(income);
  $('kpiExpense').textContent = fmt(expense);
  $('kpiReimburse').textContent = fmt(due);
  $('kpiAccounts').textContent = `${accounts.length} account${accounts.length!==1?'s':''}`;
  $('dashRecentList').innerHTML = transactions.slice(0,8).map(txnHTML).join('') || '<div class="empty-state">No transactions yet.</div>';
  $('dashAccountsList').innerHTML = accounts.map(a => `
  <div class="txn-item">
  <div class="ico-circle">${iconHTML(a.emoji, '💳')}</div>
  <div class="txn-meta"><div class="txn-cat">${a.name}</div><div class="txn-sub">${a.type}</div></div>
  <div class="txn-right"><div>${fmt(accountBalance(a.id))}</div></div>
  </div>`).join('') || '<div class="empty-state">No accounts yet.</div>';
}

function renderAccounts() {
  $('accountsList').innerHTML = accounts.length ? accounts.map(a => `
  <article class="account-card">
  <div class="ico-circle">${iconHTML(a.emoji, '💳')}</div>
  <div><strong>${a.name}</strong><div class="txn-sub">${a.type}</div></div>
  <div style="margin-left:auto;text-align:right"><div class="kpi-value">${fmt(accountBalance(a.id))}</div></div>
  <div class="row-actions" style="margin-top:8px">
  <button class="btn-sm" onclick="editAccount('${a.id}')">Edit</button>
  <button class="btn-danger" onclick="deleteAccount('${a.id}')">Delete</button>
  </div>
  </article>`).join('') : '<div class="empty-state">No accounts yet.</div>';
}

function renderTransactions() {
  const tType = $('txnFilterType').value;
  const tAcc = $('txnFilterAccount').value;
  const tMon = $('txnFilterMonth').value;
  $('txnFilterAccount').innerHTML = '<option value="">All accounts</option>' + accounts.map(a => `<option value="${a.id}" ${a.id===tAcc?'selected':''}>${iconHTML(a.emoji, '💳')} ${a.name}</option>`).join('');
  let list = [...transactions];
  if (tType) list = list.filter(t => t.is_transfer ? tType==='transfer' : t.type===tType);
  if (tAcc) list = list.filter(t => t.account_id===tAcc || t.transfer_to_account_id===tAcc);
  if (tMon) list = list.filter(t => t.date && t.date.startsWith(tMon));
  $('txnList').innerHTML = list.length ? list.map(txnHTML).join('') : '<div class="empty-state">No transactions match these filters.</div>';
}

// ── Meow-style Reimburse Timeline ────────────────────────────────────────────

// Get category icon for a reimburse entry (uses linked transaction's category, or remarks hint)
function reimbCatIcon(x) {
  // Try to find the linked expense transaction to get its category icon
  const linked = transactions.find(t => t.reimburse_id === x.id);
  if (linked) {
    const cat = categories.find(c => c.id === linked.category_id);
    if (cat?.emoji) {
      if (String(cat.emoji).startsWith('http')) {
        return `<img src="${cat.emoji}" alt="" style="width:32px;height:32px;object-fit:contain;" />`;
      }
      return cat.emoji;
    }
  }
  // fallback: person initial in coloured circle
  return (x.person_name || '?')[0].toUpperCase();
}

// Format date for display: "Mar 06" style + day-of-week
function fmtDateHeader(dateStr) {
  if (!dateStr) return { mon: '', day: '', dow: '' };
  const d = new Date(dateStr + 'T00:00:00');
  const mon = d.toLocaleString('en-US', { month: 'short' });
  const day = String(d.getDate()).padStart(2, '0');
  const dow = d.toLocaleString('en-US', { weekday: 'short' });
  return { mon, day, dow };
}

function reimbRowHTML(x) {
  const due    = Math.max(0, Number(x.total_amount) - (Number(x.paid_back) || 0));
  const pct    = Math.min(100, Math.round(((Number(x.paid_back) || 0) / (Number(x.total_amount) || 1)) * 100));
  const status = x.status || 'pending';
  const catIcon = reimbCatIcon(x);
  const amtCls = status === 'settled' ? 'amt-settled' : status === 'partial' ? 'amt-partial' : 'amt-pending';
  const displayAmt = status === 'settled'
    ? fmt(x.total_amount)
    : `-${fmt(due)}`;

  const subParts = [];
  if (x.remarks) subParts.push(`📝 ${x.remarks}`);
  if (due > 0 && status !== 'settled') subParts.push(`<span class="reimb-chip-sm chip-due">Due ${fmt(due)}</span>`);
  if (Number(x.paid_back) > 0) subParts.push(`<span class="reimb-chip-sm chip-paid">Paid ${fmt(x.paid_back)}</span>`);

  return `
  <div class="reimb-row reimb-row-wrap status-${status}">
    <div class="reimb-row-top">
      <div class="reimb-cat-icon">${catIcon}</div>
      <div class="reimb-row-info">
        <div class="reimb-row-title">${x.person_name}</div>
        <div class="reimb-row-sub">${subParts.join('') || fmt(x.total_amount)}</div>
        <div class="reimb-mini-bar"><div class="reimb-mini-bar-fill" style="width:${pct}%"></div></div>
      </div>
      <div class="reimb-row-right">
        <span class="reimb-row-amt ${amtCls}">${displayAmt}</span>
        <span class="reimb-badge-sm badge-${status}">${status}</span>
      </div>
    </div>
    <div class="reimb-row-actions">
      ${status !== 'settled' ? `<button class="btn-sm" onclick="openPayback('${x.id}')">💰 Payback</button>` : ''}
      <button class="btn-sm" onclick="editReimburse('${x.id}')">✏️ Edit</button>
      <button class="btn-danger" onclick="deleteReimburse('${x.id}')">🗑️ Delete</button>
    </div>
  </div>`;
}

function renderReimburse() {
  const container = $('reimburseList');

  // Filter by active sub-tab
  const filtered = currentReimbTab === 'reimburse'
    ? reimbursements.filter(x => x.status !== 'settled')
    : reimbursements.filter(x => x.status === 'settled');

  // Running totals
  const totalAmt = reimbursements.reduce((s, x) => s + Number(x.total_amount), 0);
  const dueAmt   = reimbursements.filter(x => x.status !== 'settled').reduce((s, x) => s + (Number(x.total_amount) - Number(x.paid_back || 0)), 0);

  // Group by date (use created_at date)
  const groups = {};
  for (const x of filtered) {
    const dateKey = (x.created_at || '').slice(0, 10) || 'Unknown';
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(x);
  }
  const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  let html = `
  <div class="reimb-tabs">
    <button class="reimb-tab ${currentReimbTab === 'reimburse' ? 'active' : ''}" onclick="switchReimbTab('reimburse')">Reimburse</button>
    <button class="reimb-tab ${currentReimbTab === 'refunded' ? 'active' : ''}" onclick="switchReimbTab('refunded')">Refunded</button>
  </div>
  <div class="reimb-totals">
    <span class="tot-t