import { supabase } from "./supabase.js";

const { data: { session } } = await supabase.auth.getSession();
if (!session) { window.location.replace("./login.html"); }
const USER = session.user;

let accounts=[], categories=[], transactions=[], reimbursements=[], profile={};
let currentTxnType='expense', currentCatType='expense';
let currentImportKind='transactions', importRows=[], importHeaders=[];
let iconTargetInput=null;
let reimbActiveTab = 'pending';

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
const sym = c => ({USD:'$', EUR:'€', GBP:'£'}[c] || '₹');
const fmt = (n, c='₹') => c + Number(n||0).toLocaleString('en-IN', {minimumFractionDigits:0, maximumFractionDigits:2});

function norm(s) { return String(s||'').trim().replace(/\s+/g,' ').toLowerCase(); }

function iconHTML(val, fallback='💳') {
  if (!val) return fallback;
  if (String(val).startsWith('http')) return `<img src="${val}" style="width:28px;height:28px;object-fit:contain" />`;
  return val;
}

function toast(msg) {
  let t = $('toast');
  if (!t) { t=document.createElement('div'); t.id='toast'; t.style.cssText='position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#28251d;color:#f9f8f4;padding:10px 20px;border-radius:999px;font-size:14px;font-weight:600;z-index:9999;display:none'; document.body.appendChild(t); }
  t.textContent = msg; t.style.display='block'; clearTimeout(toast._t); toast._t = setTimeout(() => t.style.display='none', 2400);
}

function openModal(id) { $(id).classList.remove('hidden'); }
function closeModal(id) { $(id).classList.add('hidden'); }

function showSkippedPopup(skippedAccounts, skippedDupeRows, skippedNoAmount) {
  let existing = document.getElementById('skippedPopup');
  if (existing) existing.remove();
  const lines = [];
  if (skippedAccounts.length) {
    const unique = [...new Set(skippedAccounts)];
    lines.push(`⚠️ ${skippedAccounts.length} row${skippedAccounts.length>1?'s':''} skipped — account not registered:`);
    lines.push(unique.map(h=>`• ${h}`).join('\n'));
  }
  if (skippedDupeRows.length) lines.push(`⚠️ ${skippedDupeRows.length} duplicate row${skippedDupeRows.length>1?'s':''} skipped.`);
  if (skippedNoAmount.length)  lines.push(`⚠️ ${skippedNoAmount.length} row${skippedNoAmount.length>1?'s':''} skipped — zero/missing amount.`);
  if (!lines.length) return;
  const pop = document.createElement('div');
  pop.id = 'skippedPopup';
  pop.style.cssText = 'position:fixed;bottom:110px;left:50%;transform:translateX(-50%);background:#28251d;color:#f9f8f4;padding:14px 20px;border-radius:16px;font-size:13px;z-index:9999;max-width:360px;white-space:pre-wrap;line-height:1.6';
  pop.textContent = lines.join('\n\n');
  const close = document.createElement('button');
  close.textContent = '✕'; close.style.cssText='float:right;background:none;border:none;color:#f9f8f4;cursor:pointer;font-size:16px;margin-left:12px';
  close.onclick = () => pop.remove();
  pop.prepend(close);
  document.body.appendChild(pop);
  setTimeout(() => pop.remove(), 8000);
}

// ── Data loaders ──────────────────────────────────────────────────────────────
async function loadAll() {
  const uid = USER.id;
  const [ac, ca, tx, re, pr] = await Promise.all([
    supabase.from('accounts').select('*').eq('user_id', uid),
    supabase.from('categories').select('*').eq('user_id', uid),
    supabase.from('transactions').select('*').eq('user_id', uid).order('date', {ascending:false}),
    supabase.from('reimbursements').select('*').eq('user_id', uid).order('date', {ascending:false}),
    supabase.from('profiles').select('*').eq('id', uid).single(),
  ]);
  accounts       = ac.data  || [];
  categories     = ca.data  || [];
  transactions   = tx.data  || [];
  reimbursements = re.data  || [];
  profile        = pr.data  || {};
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function accSelect(elId) {
  const el = $(elId); if (!el) return;
  el.innerHTML = accounts.map(a => `<option value="${a.id}">${iconHTML(a.icon,'')} ${a.name}</option>`).join('');
}

function catSelect(elId, type) {
  const el = $(elId); if (!el) return;
  const filtered = type ? categories.filter(c => c.type === type) : categories;
  el.innerHTML = `<option value="">— No category —</option>` +
    filtered.map(c => `<option value="${c.id}">${iconHTML(c.icon,'')} ${c.name}</option>`).join('');
}

// ── Render dispatcher ─────────────────────────────────────────────────────────
function render() {
  const r = route();
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.dataset.view === r));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.toggle('active', l.dataset.route === r));
  document.querySelectorAll('.mob-link').forEach(l => l.classList.toggle('active', l.dataset.route === r));
  $('pageTitle').textContent = ROUTES[r]?.title || '';
  $('pageSub').textContent   = ROUTES[r]?.sub   || '';
  if (r === 'dashboard')    renderDashboard();
  if (r === 'accounts')     renderAccounts();
  if (r === 'transactions') renderTransactions();
  if (r === 'reimburse')    renderReimburse();
  if (r === 'ledger')       renderLedger();
  if (r === 'recurring')    renderRecurring();
  if (r === 'reports')      renderReports();
  if (r === 'settings')     renderSettings();
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function renderDashboard() {
  const balance = accounts.reduce((s,a) => s + Number(a.balance||0), 0);
  const now = new Date(); const mo = now.getMonth(); const yr = now.getFullYear();
  const thisMo = transactions.filter(t => { const d=new Date(t.date); return d.getMonth()===mo && d.getFullYear()===yr; });
  const income  = thisMo.filter(t=>t.type==='income').reduce((s,t)=>s+Number(t.amount),0);
  const expense = thisMo.filter(t=>t.type==='expense').reduce((s,t)=>s+Number(t.amount),0);
  const due     = reimbursements.filter(r=>r.status!=='settled').reduce((s,r)=>s+(Number(r.total_amount)-(Number(r.paid_back)||0)),0);
  $('kpiBalance').textContent   = fmt(balance);
  $('kpiIncome').textContent    = fmt(income);
  $('kpiExpense').textContent   = fmt(expense);
  $('kpiReimburse').textContent = fmt(due);
  $('kpiAccounts').textContent  = `${accounts.length} account${accounts.length!==1?'s':''}`;

  const recent = [...transactions].slice(0, 8);
  $('dashRecentList').innerHTML = recent.length
    ? recent.map(t => txnRowHTML(t)).join('')
    : '<div class="empty-state">No transactions yet.</div>';

  $('dashAccountsList').innerHTML = accounts.length
    ? accounts.map(a => `<div class="list-row"><span>${iconHTML(a.icon,'💳')} ${a.name}</span><strong>${fmt(a.balance)}</strong></div>`).join('')
    : '<div class="empty-state">No accounts yet.</div>';
}

// ── Accounts ──────────────────────────────────────────────────────────────────
function renderAccounts() {
  $('accountsList').innerHTML = accounts.length
    ? accounts.map(a => `
      <article class="account-card">
        <div class="acc-icon">${iconHTML(a.icon,'💳')}</div>
        <div class="acc-info"><strong>${a.name}</strong><span class="acc-type">${a.type}</span></div>
        <div class="acc-balance">${fmt(a.balance)}</div>
        <div class="card-actions">
          <button class="btn-sm" onclick="editAccount('${a.id}')">Edit</button>
          <button class="btn-sm danger" onclick="deleteAccount('${a.id}')">Delete</button>
        </div>
      </article>`).join('')
    : '<div class="empty-state">No accounts yet.</div>';
}

window.editAccount = id => {
  const a = accounts.find(x=>x.id===id); if (!a) return;
  $('accountId').value      = a.id;
  $('accountIcon').value    = a.icon || '💳';
  $('accountName').value    = a.name;
  $('accountType').value    = a.type;
  $('accountBalance').value = a.balance;
  $('accountModalTitle').textContent = 'Edit Account';
  openModal('accountModal');
};

window.deleteAccount = async id => {
  if (!confirm('Delete this account?')) return;
  await supabase.from('accounts').delete().eq('id', id);
  await loadAll(); render();
};

$('addAccountBtn').onclick = () => {
  $('accountId').value = ''; $('accountIcon').value='💳'; $('accountName').value=''; $('accountBalance').value=0;
  $('accountModalTitle').textContent = 'New Account';
  openModal('accountModal');
};

$('saveAccountBtn').onclick = async () => {
  const id = $('accountId').value;
  const payload = {
    name: $('accountName').value.trim(),
    type: $('accountType').value,
    icon: $('accountIcon').value,
    balance: parseFloat($('accountBalance').value)||0,
  };
  if (!payload.name) return toast('Enter account name');
  if (id) {
    await supabase.from('accounts').update(payload).eq('id', id);
  } else {
    await supabase.from('accounts').insert({ ...payload, user_id: USER.id });
  }
  closeModal('accountModal'); await loadAll(); render();
};

// ── Transactions ──────────────────────────────────────────────────────────────
function txnRowHTML(t) {
  const cat = categories.find(c=>c.id===t.category_id);
  const acc = accounts.find(a=>a.id===t.account_id);
  const icon = cat ? iconHTML(cat.icon,'📂') : (t.type==='income'?'💰':t.type==='transfer'?'🔁':'💸');
  const sign = t.type==='income' ? '+' : t.type==='transfer' ? '⇄' : '-';
  const cls  = t.type==='income' ? 'green' : t.type==='transfer' ? '' : 'red';
  return `<div class="list-row">
    <span class="txn-icon">${icon}</span>
    <div class="txn-meta">
      <span class="txn-label">${cat?.name||t.type} ${t.remarks ? `· ${t.remarks}` : ''}</span>
      <span class="txn-sub">${t.date} · ${acc?.name||''}</span>
    </div>
    <strong class="${cls}">${sign}${fmt(t.amount)}</strong>
    <div class="row-actions">
      <button class="btn-sm" onclick="editTxn('${t.id}')">Edit</button>
      <button class="btn-sm danger" onclick="deleteTxn('${t.id}')">Del</button>
    </div>
  </div>`;
}

function renderTransactions() {
  const type  = $('txnFilterType').value;
  const accId = $('txnFilterAccount').value;
  const month = $('txnFilterMonth').value;
  let list = [...transactions];
  if (type)  list = list.filter(t=>t.type===type);
  if (accId) list = list.filter(t=>t.account_id===accId);
  if (month) list = list.filter(t=>t.date?.startsWith(month));
  $('txnList').innerHTML = list.length
    ? list.map(txnRowHTML).join('')
    : '<div class="empty-state">No transactions match filter.</div>';

  const sel = $('txnFilterAccount');
  const cur = sel.value;
  sel.innerHTML = '<option value="">All accounts</option>' + accounts.map(a=>`<option value="${a.id}">${a.name}</option>`).join('');
  sel.value = cur;
}

window.editTxn = id => {
  const t = transactions.find(x=>x.id===id); if (!t) return;
  $('txnId').value       = t.id;
  $('txnAmount').value   = t.amount;
  $('txnDate').value     = t.date;
  $('txnRemarks').value  = t.remarks||'';
  currentTxnType = t.type;
  document.querySelectorAll('#txnTypeTabs .type-tab').forEach(b=>{
    b.classList.toggle('active', b.dataset.type===t.type);
  });
  accSelect('txnAccount');   $('txnAccount').value = t.account_id;
  catSelect('txnCategory', t.type==='transfer'?null:t.type);
  $('txnCategory').value = t.category_id||'';
  $('txnTransferToField').style.display = t.type==='transfer'?'':'none';
  if (t.type==='transfer') { accSelect('txnTransferTo'); $('txnTransferTo').value=t.to_account_id||''; }
  $('txnModalTitle').textContent = 'Edit Transaction';
  openModal('txnModal');
};

window.deleteTxn = async id => {
  if (!confirm('Delete this transaction?')) return;
  const t = transactions.find(x=>x.id===id);
  if (t) {
    const acc = accounts.find(a=>a.id===t.account_id);
    if (acc) {
      const adj = t.type==='income' ? -Number(t.amount) : Number(t.amount);
      await supabase.from('accounts').update({balance: Number(acc.balance)+adj}).eq('id',acc.id);
    }
  }
  await supabase.from('transactions').delete().eq('id',id);
  await loadAll(); render();
};

$('addTxnBtn').onclick = $('quickAddBtn').onclick = $('fabBtn').onclick = () => {
  $('txnId').value=''; $('txnAmount').value=''; $('txnRemarks').value=''; $('txnDate').value=today();
  currentTxnType='expense';
  document.querySelectorAll('#txnTypeTabs .type-tab').forEach(b=>b.classList.toggle('active',b.dataset.type==='expense'));
  accSelect('txnAccount'); catSelect('txnCategory','expense');
  $('txnTransferToField').style.display='none';
  $('txnModalTitle').textContent='Add Transaction';
  openModal('txnModal');
};

document.querySelectorAll('#txnTypeTabs .type-tab').forEach(btn => {
  btn.onclick = () => {
    currentTxnType = btn.dataset.type;
    document.querySelectorAll('#txnTypeTabs .type-tab').forEach(b=>b.classList.toggle('active',b===btn));
    catSelect('txnCategory', currentTxnType==='transfer'?null:currentTxnType);
    $('txnTransferToField').style.display = currentTxnType==='transfer'?'':'none';
    $('txnCategoryField').style.display   = currentTxnType==='transfer'?'none':'';
  };
});

$('saveTxnBtn').onclick = async () => {
  const id      = $('txnId').value;
  const amount  = parseFloat($('txnAmount').value);
  const accId   = $('txnAccount').value;
  const catId   = $('txnCategory').value || null;
  const date    = $('txnDate').value;
  const remarks = $('txnRemarks').value.trim();
  const toAccId = $('txnTransferTo').value || null;
  if (!amount || !accId || !date) return toast('Fill required fields');

  if (id) {
    await supabase.from('transactions').update({ amount, category_id:catId, date, remarks, type:currentTxnType }).eq('id',id);
  } else {
    const acc = accounts.find(a=>a.id===accId);
    if (!acc) return toast('Account not found');
    const adj = currentTxnType==='income' ? Number(amount) : -Number(amount);
    await supabase.from('accounts').update({balance: Number(acc.balance)+adj}).eq('id',accId);
    if (currentTxnType==='transfer' && toAccId) {
      const toAcc = accounts.find(a=>a.id===toAccId);
      if (toAcc) await supabase.from('accounts').update({balance: Number(toAcc.balance)+Number(amount)}).eq('id',toAccId);
    }
    await supabase.from('transactions').insert({ user_id:USER.id, amount, account_id:accId, type:currentTxnType, category_id:catId, date, remarks, is_transfer:currentTxnType==='transfer', to_account_id:toAccId });
  }
  closeModal('txnModal'); await loadAll(); render();
};

$('txnFilterType').onchange = $('txnFilterAccount').onchange = $('txnFilterMonth').onchange = () => renderTransactions();

// ── Reimburse ─────────────────────────────────────────────────────────────────
function reimburseEntryHTML(x) {
  const due    = Number(x.total_amount) - (Number(x.paid_back) || 0);
  const pct    = Math.min(100, Math.round(((Number(x.paid_back)||0) / Number(x.total_amount)) * 100));
  const status = x.status || 'pending';

  const cat     = categories.find(c => c.id === x.category_id);
  const catIcon = cat ? iconHTML(cat.icon, '🔄') : '🔄';
  const catName = cat ? cat.name : 'Reimburse';
  const acc     = accounts.find(a => a.id === x.account_id);
  const accName = acc ? acc.name : '';

  const dispAmt  = status === 'settled' ? fmt(x.total_amount) : fmt(due);
  const dispSign = status === 'settled' ? '' : '-';
  const amtCls   = status === 'settled' ? 'amt-settled' : status === 'partial' ? 'amt-partial' : 'amt-pending';

  const totalLabel = status !== 'settled'
    ? `<span class="reimb-total-label">Total ${fmt(x.total_amount)}</span>`
    : `<span class="reimb-total-label">Paid ${fmt(x.paid_back||0)}</span>`;

  const remarksHTML = x.remarks
    ? `<div class="reimb-remarks">${x.remarks}</div>` : '';

  return `
  <div class="reimb-entry">
    <div class="reimb-line-col">
      <div class="reimb-dot"></div>
      <div class="reimb-line"></div>
    </div>
    <div class="reimb-card status-${status}">
      <div class="reimb-icon-bubble">${catIcon}</div>
      <div class="reimb-info">
        <div class="reimb-person">${x.person_name}</div>
        <div class="reimb-sub-row">
          <span class="reimb-chip chip-cat">${catName}</span>
          ${accName ? `<span class="reimb-chip chip-account">${accName}</span>` : ''}
        </div>
        ${remarksHTML}
        <div class="reimb-progress-wrap">
          <div class="reimb-progress-fill" style="width:${pct}%"></div>
        </div>
      </div>
      <div class="reimb-amount-col">
        <span class="reimb-amount ${amtCls}">${dispSign}${dispAmt}</span>
        ${totalLabel}
      </div>
      <div class="reimb-card-actions">
        ${status !== 'settled' ? `<button class="reimb-action-btn" title="Record payback" onclick="openPayback('${x.id}')">💰</button>` : ''}
        <button class="reimb-action-btn" title="Edit" onclick="editReimburse('${x.id}')">✏️</button>
        <button class="reimb-action-btn danger" title="Delete" onclick="deleteReimburse('${x.id}')">🗑</button>
      </div>
    </div>
  </div>`;
}

function renderReimburse() {
  const isPendingTab = reimbActiveTab === 'pending';
  const filtered = reimbursements.filter(x =>
    isPendingTab ? x.status !== 'settled' : x.status === 'settled'
  );

  const totalDue = reimbursements
    .filter(x => x.status !== 'settled')
    .reduce((s,x) => s + (Number(x.total_amount) - (Number(x.paid_back)||0)), 0);
  const totalAll = reimbursements.reduce((s,x) => s + Number(x.total_amount), 0);

  $('reimbStatsRow').innerHTML = `
    <span class="reimb-stat-total">Total ${fmt(totalAll)}</span>
    <span class="reimb-stat-due">Due ${fmt(totalDue)}</span>
  `;

  if (!filtered.length) {
    $('reimburseList').innerHTML = `<div class="reimb-empty">${isPendingTab ? 'No pending reimbursements 🎉' : 'No refunded entries yet.'}</div>`;
    return;
  }

  const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const MONTHS   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const groups = {};
  filtered.forEach(x => {
    const d = x.date || 'Unknown';
    if (!groups[d]) groups[d] = [];
    groups[d].push(x);
  });

  let html = '';
  Object.keys(groups).sort((a,b) => b.localeCompare(a)).forEach(dateKey => {
    const entries = groups[dateKey];
    let dateLabel = dateKey, weekday = '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      const d   = new Date(dateKey + 'T00:00:00');
      const mo  = MONTHS[d.getMonth()];
      const day = d.getDate();
      const yr  = d.getFullYear();
      const now = new Date();
      dateLabel = yr === now.getFullYear()
        ? `${mo} ${String(day).padStart(2,'0')}`
        : `${mo} ${String(day).padStart(2,'0')} ${yr}`;
      weekday = WEEKDAYS[d.getDay()];
    }
    const grpTotal = entries.reduce((s,x) => s + Number(x.total_amount), 0);
    const grpDue   = entries.reduce((s,x) => s + (Number(x.total_amount)-(Number(x.paid_back)||0)), 0);

    html += `
    <div class="reimb-date-group">
      <span class="reimb-date-label">${dateLabel}</span>
      ${weekday ? `<span class="reimb-date-weekday">${weekday}</span>` : ''}
      <div class="reimb-date-meta">
        <span class="reimb-date-plus">${fmt(grpTotal)}</span>
        ${grpDue > 0 ? `<span class="reimb-date-minus">-${fmt(grpDue)}</span>` : '<span class="reimb-date-plus">✓</span>'}
      </div>
    </div>`;
    entries.forEach(x => { html += reimburseEntryHTML(x); });
  });

  $('reimburseList').innerHTML = html;
}

window.openPayback = id => {
  $('paybackReimburseId').value = id;
  $('paybackAmount').value = '';
  $('paybackDate').value   = today();
  $('paybackRemarks').value = '';
  accSelect('paybackAccount');
  openModal('paybackModal');
};

window.editReimburse = id => {
  const x = reimbursements.find(r => r.id === id); if (!x) return;
  $('reimbId').value          = x.id;
  $('reimbPersonName').value  = x.person_name;
  $('reimbAmount').value      = x.total_amount;
  $('reimbRemarks').value     = x.remarks || '';
  $('reimbDate').value        = x.date || today();
  catSelect('reimbCategory', 'expense');
  $('reimbCategory').value    = x.category_id || '';
  accSelect('reimbAccount');
  $('reimbAccount').value     = x.account_id || '';
  $('reimburseModalTitle').textContent = 'Edit Reimbursement';
  openModal('reimburseModal');
};

window.deleteReimburse = async id => {
  if (!confirm('Delete this reimbursement?')) return;
  await supabase.from('reimbursements').delete().eq('id', id);
  await loadAll(); render();
};

$('addReimburseBtn').onclick = () => {
  $('reimbId').value = '';
  $('reimbPersonName').value = '';
  $('reimbAmount').value = '';
  $('reimbRemarks').value = '';
  $('reimbDate').value = today();
  catSelect('reimbCategory', 'expense');
  accSelect('reimbAccount');
  $('reimburseModalTitle').textContent = 'New Reimbursement';
  openModal('reimburseModal');
};

$('saveReimburseBtn').onclick = async () => {
  const id           = $('reimbId').value;
  const person_name  = $('reimbPersonName').value.trim();
  const total_amount = parseFloat($('reimbAmount').value);
  const account_id   = $('reimbAccount').value;
  const category_id  = $('reimbCategory').value || null;
  const date         = $('reimbDate').value;
  const remarks      = $('reimbRemarks').value.trim();
  if (!person_name || !total_amount || !account_id) return toast('Fill all required fields');

  if (id) {
    const { error } = await supabase.from('reimbursements')
      .update({ person_name, total_amount, category_id, remarks, date })
      .eq('id', id);
    if (error) return toast('❌ ' + error.message);
    toast('✅ Updated');
  } else {
    const { data: rb, error } = await supabase.from('reimbursements')
      .insert({ user_id: USER.id, person_name, total_amount, paid_back: 0, status: 'pending', category_id, date, remarks })
      .select().single();
    if (error) return toast('❌ ' + error.message);
    const acc = accounts.find(a => a.id === account_id);
    if (acc) await supabase.from('accounts').update({ balance: Number(acc.balance) - total_amount }).eq('id', account_id);
    await supabase.from('transactions').insert({
      user_id: USER.id, account_id, amount: total_amount, type: 'expense',
      date, remarks: remarks || `Reimburse: ${person_name}`,
      is_transfer: false, reimburse_id: rb.id, category_id
    });
    toast('✅ Added');
  }
  closeModal('reimburseModal'); await loadAll(); render();
};

$('savePaybackBtn').onclick = async () => {
  const reimbId = $('paybackReimburseId').value;
  const amount  = parseFloat($('paybackAmount').value);
  const accId   = $('paybackAccount').value;
  const date    = $('paybackDate').value;
  const remarks = $('paybackRemarks').value.trim();
  if (!amount || !accId) return toast('Fill required fields');

  const reimb = reimbursements.find(r => r.id === reimbId);
  if (!reimb) return toast('Not found');
  const newPaid = (Number(reimb.paid_back)||0) + amount;
  const status  = newPaid >= Number(reimb.total_amount) ? 'settled' : 'partial';

  await supabase.from('reimbursements').update({ paid_back: newPaid, status }).eq('id', reimbId);
  const acc = accounts.find(a => a.id === accId);
  if (acc) await supabase.from('accounts').update({ balance: Number(acc.balance) + amount }).eq('id', accId);
  await supabase.from('transactions').insert({
    user_id: USER.id, account_id: accId, amount, type: 'income',
    date, remarks: remarks || `Payback: ${reimb.person_name}`, is_transfer: false, reimburse_id: reimbId
  });
  closeModal('paybackModal'); await loadAll(); render();
};

// ── Ledger ────────────────────────────────────────────────────────────────────
function renderLedger() {
  $('ledgerList').innerHTML = '<div class="empty-state">Ledger coming soon.</div>';
}
$('addLedgerPersonBtn').onclick = () => toast('Ledger feature coming soon!');

// ── Recurring ─────────────────────────────────────────────────────────────────
function renderRecurring() {
  $('recurringList').innerHTML = '<div class="empty-state">Recurring rules coming soon.</div>';
}
$('addRecurringBtn').onclick = () => toast('Recurring feature coming soon!');

// ── Reports ───────────────────────────────────────────────────────────────────
function renderReports() {
  const now = new Date(); const mo = now.getMonth(); const yr = now.getFullYear();
  const thisMo = transactions.filter(t => { const d=new Date(t.date); return d.getMonth()===mo && d.getFullYear()===yr; });
  const income  = thisMo.filter(t=>t.type==='income').reduce((s,t)=>s+Number(t.amount),0);
  const expense = thisMo.filter(t=>t.type==='expense').reduce((s,t)=>s+Number(t.amount),0);
  $('repIncome').textContent  = fmt(income);
  $('repExpense').textContent = fmt(expense);
  $('repSavings').textContent = fmt(income - expense);

  const byCat = {};
  thisMo.filter(t=>t.type==='expense').forEach(t => {
    const cat = categories.find(c=>c.id===t.category_id);
    const key = cat?.name || 'Uncategorised';
    byCat[key] = (byCat[key]||0) + Number(t.amount);
  });
  const sorted = Object.entries(byCat).sort((a,b)=>b[1]-a[1]);
  $('reportCatList').innerHTML = sorted.length
    ? sorted.map(([k,v])=>`<div class="list-row"><span>${k}</span><strong class="red">${fmt(v)}</strong></div>`).join('')
    : '<div class="empty-state">No expense data this month.</div>';
}

$('exportCsvBtn').onclick = () => {
  const headers = ['date','type','amount','account','category','remarks'];
  const rows = transactions.map(t => {
    const acc = accounts.find(a=>a.id===t.account_id);
    const cat = categories.find(c=>c.id===t.category_id);
    return [t.date, t.type, t.amount, acc?.name||'', cat?.name||'', t.remarks||''].join(',');
  });
  const blob = new Blob([[headers.join(','), ...rows].join('\n')], {type:'text/csv'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href=url; a.download='flowledger-export.csv'; a.click();
};

// ── Settings ──────────────────────────────────────────────────────────────────
function renderSettings() {
  $('settingName').value     = profile.display_name || '';
  $('settingCurrency').value = profile.currency || 'INR';

  $('categoryList').innerHTML = categories.length
    ? categories.map(c => `
      <div class="list-row">
        <span>${iconHTML(c.icon,'📂')} ${c.name} <small>(${c.type})</small></span>
        <div class="row-actions">
          <button class="btn-sm danger" onclick="deleteCategory('${c.id}')">Del</button>
        </div>
      </div>`).join('')
    : '<div class="empty-state">No categories yet.</div>';
}

$('saveProfileBtn').onclick = async () => {
  await supabase.from('profiles').upsert({ id: USER.id, display_name: $('settingName').value.trim(), currency: $('settingCurrency').value });
  toast('✅ Profile saved'); await loadAll(); render();
};

$('addCategoryBtn').onclick = () => {
  $('catIcon').value='📂'; $('catName').value='';
  document.querySelectorAll('#catTypeTabs .type-tab').forEach(b=>b.classList.toggle('active',b.dataset.ctype==='expense'));
  currentCatType='expense';
  openModal('categoryModal');
};

document.querySelectorAll('#catTypeTabs .type-tab').forEach(btn => {
  btn.onclick = () => {
    currentCatType = btn.dataset.ctype;
    document.querySelectorAll('#catTypeTabs .type-tab').forEach(b=>b.classList.toggle('active',b===btn));
  };
});

$('saveCategoryBtn').onclick = async () => {
  const name = $('catName').value.trim();
  const icon = $('catIcon').value;
  if (!name) return toast('Enter category name');
  await supabase.from('categories').insert({ user_id:USER.id, name, icon, type:currentCatType });
  closeModal('categoryModal'); await loadAll(); render();
};

window.deleteCategory = async id => {
  if (!confirm('Delete this category?')) return;
  await supabase.from('categories').delete().eq('id',id);
  await loadAll(); render();
};

// ── Import CSV ────────────────────────────────────────────────────────────────
$('openTxnImportBtn').onclick = $('openReimburseImportBtn').onclick = () => openModal('importModal');

document.querySelectorAll('[data-import-kind]').forEach(btn => {
  btn.onclick = () => {
    currentImportKind = btn.dataset.importKind;
    document.querySelectorAll('[data-import-kind]').forEach(b=>b.classList.toggle('active',b===btn));
  };
});

$('importFile').onchange = () => previewImport();
$('previewImportBtn').onclick = () => previewImport();

function getDelimiter() { return $('importDelimiter').value; }
function getDateFormat() { return $('importDateFormat').value; }

function parseCSVLine(line, delim) {
  const result=[]; let cur='', inQ=false;
  for (let i=0;i<line.length;i++) {
    const ch=line[i];
    if (ch==='"') { inQ=!inQ; }
    else if (ch===delim && !inQ) { result.push(cur.trim()); cur=''; }
    else cur+=ch;
  }
  result.push(cur.trim()); return result;
}

function parseDate(raw, fmt) {
  if (!raw) return '';
  raw = raw.trim();
  if (fmt==='dd/mm/yyyy') { const [d,m,y]=raw.split('/'); return `${y}-${m?.padStart(2,'0')}-${d?.padStart(2,'0')}`; }
  if (fmt==='mm/dd/yyyy') { const [m,d,y]=raw.split('/'); return `${y}-${m?.padStart(2,'0')}-${d?.padStart(2,'0')}`; }
  return raw.slice(0,10);
}

function previewImport() {
  const file=$('importFile').files[0]; if (!file) return;
  const reader=new FileReader();
  reader.onload=e=>{
    const lines=e.target.result.split('\n').map(l=>l.trim()).filter(Boolean);
    const skipS=parseInt($('importSkipStart').value)||0;
    const skipE=parseInt($('importSkipEnd').value)||0;
    const hasH=$('importHasHeader').checked;
    const delim=getDelimiter();
    const body=lines.slice(skipS, skipE?-skipE:undefined);
    importHeaders=hasH ? parseCSVLine(body[0],delim) : body[0]?.split(delim).map((_,i)=>`col${i}`)||[];
    importRows=body.slice(hasH?1:0).map(l=>parseCSVLine(l,delim));
    const preview=importRows.slice(0,5).map(r=>`<div class="import-row">${r.join(' | ')}</div>`).join('');
    $('importPreview').innerHTML=preview||'No rows found.';
    buildMappingGrid();
  };
  reader.readAsText(file);
}

function buildMappingGrid() {
  const fields = currentImportKind==='reimburse'
    ? ['person_name','total_amount','date','remarks','account','category']
    : ['date','amount','type','account','category','remarks','transfer_to'];
  $('mappingGrid').innerHTML = fields.map(f=>`
    <div class="map-row">
      <label class="label">${f}</label>
      <select class="input map-sel" data-field="${f}">
        <option value="">— skip —</option>
        ${importHeaders.map((h,i)=>`<option value="${i}">${h}</option>`).join('')}
      </select>
    </div>`).join('');
  // Auto-map by name
  document.querySelectorAll('.map-sel').forEach(sel=>{
    const field=sel.dataset.field;
    const idx=importHeaders.findIndex(h=>norm(h)===norm(field)||norm(h).includes(norm(field)));
    if (idx>=0) sel.value=idx;
  });
}

function getMapping() {
  const map={};
  document.querySelectorAll('.map-sel').forEach(sel=>{
    if (sel.value!=='') map[sel.dataset.field]=parseInt(sel.value);
  });
  return map;
}

$('runImportBtn').onclick = async () => {
  const map=getMapping(); const delim=getDelimiter(); const dateFmt=getDateFormat();
  const clearBefore=$('importClearBefore').checked;
  const skipDupe=$('importMergeExisting').checked;
  const flipAmt=$('importFlipAmount').checked;
  const useType=$('importUseTypeColumn').checked;

  const skippedAccounts=[], skippedDupeRows=[], skippedNoAmount=[];

  if (clearBefore) {
    if (currentImportKind==='reimburse') await supabase.from('reimbursements').delete().eq('user_id',USER.id);
    else await supabase.from('transactions').delete().eq('user_id',USER.id);
  }

  if (currentImportKind==='reimburse') {
    const rows=importRows.map(r=>({
      user_id: USER.id,
      person_name: map.person_name!==undefined ? r[map.person_name] : '',
      total_amount: Math.abs(parseFloat(map.total_amount!==undefined?r[map.total_amount]:0)||0),
      paid_back: 0, status:'pending',
      date: map.date!==undefined ? parseDate(r[map.date],dateFmt) : today(),
      remarks: map.remarks!==undefined ? r[map.remarks] : '',
    })).filter(r=>{ if (!r.total_amount){skippedNoAmount.push(r.person_name);return false;} return true; });
    if (rows.length) await supabase.from('reimbursements').insert(rows);
  } else {
    const toInsert=[];
    for (const r of importRows) {
      const rawAmt = map.amount!==undefined ? r[map.amount] : '0';
      let amount   = parseFloat(String(rawAmt).replace(/[^0-9.\-]/g,''))||0;
      if (!amount) { skippedNoAmount.push(r.join('|')); continue; }
      if (flipAmt) amount=-amount;

      const rawAcc = map.account!==undefined ? r[map.account] : '';
      const acc    = accounts.find(a=>norm(a.name)===norm(rawAcc));
      if (!acc) { skippedAccounts.push(rawAcc||'(blank)'); continue; }

      const rawCat = map.category!==undefined ? r[map.category] : '';
      const cat    = categories.find(c=>norm(c.name)===norm(rawCat));

      let type = 'expense';
      if (useType && map.type!==undefined) {
        const rv=norm(r[map.type]);
        if (rv==='income'||rv==='credit'||rv==='+') type='income';
        else if (rv==='transfer') type='transfer';
        else type='expense';
      } else if (amount>0) type='income';

      const date    = map.date!==undefined ? parseDate(r[map.date],dateFmt) : today();
      const remarks = map.remarks!==undefined ? r[map.remarks] : '';

      if (skipDupe) {
        const dupe=transactions.find(t=>t.date===date&&Number(t.amount)===Math.abs(amount)&&t.account_id===acc.id);
        if (dupe) { skippedDupeRows.push(date); continue; }
      }
      toInsert.push({ user_id:USER.id, amount:Math.abs(amount), type, account_id:acc.id, category_id:cat?.id||null, date, remarks, is_transfer:type==='transfer' });
    }
    if (toInsert.length) await supabase.from('transactions').insert(toInsert);
  }

  closeModal('importModal'); await loadAll(); render();
  showSkippedPopup(skippedAccounts, skippedDupeRows, skippedNoAmount);
  toast(`✅ Import done`);
};

// ── Icon Picker ───────────────────────────────────────────────────────────────
window.openIconPicker = targetId => {
  iconTargetInput = targetId;
  renderIconGrid('all', '');
  openModal('iconPickerModal');
};

function renderIconGrid(group, search) {
  const filtered = ICONS.filter(ic =>
    (group==='all' || ic.g===group) &&
    (!search || ic.l.toLowerCase().includes(search.toLowerCase()))
  );
  $('iconGrid').innerHTML = filtered.map(ic=>
    `<button class="icon-cell" type="button" title="${ic.l}" onclick="pickIcon('${ICON_BASE+ic.img}')">
      <img src="${ICON_BASE+ic.img}" alt="${ic.l}" style="width:36px;height:36px;object-fit:contain" />
      <span>${ic.l}</span>
    </button>`
  ).join('');
}

window.pickIcon = val => {
  if (iconTargetInput) $(iconTargetInput).value = val;
  closeModal('iconPickerModal');
};

$('iconSearch').oninput = () => {
  const activeGroup = document.querySelector('#iconTabRow .type-tab.active')?.dataset.iconGroup || 'all';
  renderIconGrid(activeGroup, $('iconSearch').value);
};

document.querySelectorAll('#iconTabRow .type-tab').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('#iconTabRow .type-tab').forEach(b=>b.classList.toggle('active',b===btn));
    renderIconGrid(btn.dataset.iconGroup, $('iconSearch').value);
  };
});

// ── Modal close handlers ──────────────────────────────────────────────────────
document.querySelectorAll('[data-close]').forEach(btn => {
  btn.onclick = () => closeModal(btn.dataset.close);
});
document.querySelectorAll('.modal-backdrop').forEach(bd => {
  bd.onclick = e => { if (e.target===bd) closeModal(bd.id); };
});

// ── Profile / Nav init ────────────────────────────────────────────────────────
function initProfile() {
  const email = USER.email || '';
  const name  = profile.display_name || email.split('@')[0] || 'User';
  $('userName').textContent  = name;
  $('userEmail').textContent = email;
  $('userAvatar').textContent = name[0]?.toUpperCase() || 'U';
}

$('menuBtn').onclick = () => {
  $('sidebar').classList.toggle('open');
  $('sidebarOverlay').classList.toggle('open');
};
$('sidebarOverlay').onclick = () => {
  $('sidebar').classList.remove('open');
  $('sidebarOverlay').classList.remove('open');
};
$('themeBtn').onclick = () => {
  const html = document.documentElement;
  html.dataset.theme = html.dataset.theme==='dark' ? 'light' : 'dark';
};
$('logoutBtn').onclick = async () => {
  await supabase.auth.signOut();
  window.location.replace('./login.html');
};

// ── Reimburse sub-tabs ────────────────────────────────────────────────────────
document.querySelectorAll('[data-reimb-tab]').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('[data-reimb-tab]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    reimbActiveTab = btn.dataset.reimbTab;
    renderReimburse();
  };
});

// ── Hash routing ──────────────────────────────────────────────────────────────
window.addEventListener('hashchange', () => render());
document.querySelectorAll('[data-route]').forEach(a => {
  a.onclick = () => {
    $('sidebar').classList.remove('open');
    $('sidebarOverlay').classList.remove('open');
  };
});

// ── Boot ──────────────────────────────────────────────────────────────────────
await loadAll();
initProfile();
render();