import { supabase } from "./supabase.js";

const { data: { session } } = await supabase.auth.getSession();
if (!session) { window.location.replace("./login.html"); }
const USER = session.user;

let accounts=[], categories=[], transactions=[], reimbursements=[], profile={};
let currentTxnType='expense', currentCatType='expense';
let currentImportKind='transactions', importRows=[], importHeaders=[];
let iconTargetInput=null;

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
  const n = String(name||'').trim().toLowerCase();
  return accounts.find(a => a.name.trim().toLowerCase() === n) || accounts.find(a => a.name.trim().toLowerCase().includes(n)) || null;
}
function findCategory(name, type) {
  const n = String(name||'').trim().toLowerCase();
  return categories.find(c => c.type===type && c.name.trim().toLowerCase() === n) || categories.find(c => c.type===type && c.name.trim().toLowerCase().includes(n)) || null;
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

function renderReimburse() {
  $('reimburseList').innerHTML = reimbursements.length ? reimbursements.map(x => {
    const pct = Math.min(100, Math.round(((Number(x.paid_back)||0) / Number(x.total_amount)) * 100));
    const due = Number(x.total_amount) - (Number(x.paid_back)||0);
    const badgeCls = x.status==='settled' ? 'badge-settled' : x.status==='partial' ? 'badge-partial' : 'badge-pending';
    return `<div class="reimb-item">
    <div class="card-head">
    <div><strong>👤 ${x.person_name}</strong><div class="txn-sub">Total: ${fmt(x.total_amount)} · Paid: ${fmt(x.paid_back||0)} · Due: ${fmt(due)}</div></div>
    <span class="badge ${badgeCls}">${x.status}</span>
    </div>
    <div class="progress-bar-wrap"><div class="progress-bar" style="width:${pct}%"></div></div>
    <div class="row-actions">
    ${x.status!=='settled' ? `<button class="btn-sm" onclick="openPayback('${x.id}')">Record payback</button>` : ''}
    <button class="btn-danger" onclick="deleteReimburse('${x.id}')">Delete</button>
    </div>
    </div>`;
  }).join('') : '<div class="empty-state">No reimbursements yet.</div>';
}

function renderReports() {
  const c = profile.currency || 'INR', s = sym(c);
  const mt = monthTxns();
  const income = mt.filter(t => t.type==='income' && !t.is_transfer).reduce((s,t) => s+Number(t.amount), 0);
  const expense = mt.filter(t => t.type==='expense' && !t.is_transfer).reduce((s,t) => s+Number(t.amount), 0);
  $('repIncome').textContent = fmt(income, s);
  $('repExpense').textContent = fmt(expense, s);
  $('repSavings').textContent = fmt(income - expense, s);
  const map = {};
  mt.filter(t => t.type==='expense' && !t.is_transfer).forEach(t => { const k = t.category_id||'__none'; map[k]=(map[k]||0)+Number(t.amount); });
  const total = Object.values(map).reduce((a,b)=>a+b,0) || 1;
  $('reportCatList').innerHTML = Object.entries(map).sort((a,b)=>b[1]-a[1]).map(([cid,amt]) => {
    const cat = categories.find(c => c.id===cid);
    const pct = Math.round((amt/total)*100);
    return `<div class="txn-item"><div class="ico-circle">${iconHTML(cat?.emoji, '📂')}</div><div class="txn-meta">${cat?.name||'Other'}<div class="progress-bar-wrap" style="margin-top:4px"><div class="progress-bar" style="width:${pct}%"></div></div></div><div class="txn-right">${fmt(amt,s)}</div></div>`;
  }).join('') || '<div class="empty-state">No expense data this month.</div>';
}

function renderSettings() {
  renderProfile();
  $('categoryList').innerHTML = categories.length ? categories.map(c => `
  <div class="txn-item">
  <div class="ico-circle">${iconHTML(c.emoji, '📂')}</div>
  <div class="txn-meta"><div class="txn-cat">${c.name}</div><div class="txn-sub">${c.type}</div></div>
  ${!c.is_default ? `<button class="btn-danger" style="margin-left:auto" onclick="deleteCat('${c.id}')">✕</button>` : ''}
  </div>`).join('') : '<div class="empty-state">No categories yet.</div>';
}

window.editAccount = id => {
  const a = accounts.find(x => x.id===id); if (!a) return;
  $('accountId').value = a.id;
  $('accountIcon').value = a.emoji || '💳';
  $('accountName').value = a.name;
  $('accountType').value = a.type;
  $('accountBalance').value = a.opening_balance || 0;
  $('accountModalTitle').textContent = 'Edit Account';
  openModal('accountModal');
};
window.deleteAccount = async id => {
  if (!confirm('Delete this account?')) return;
  const { error } = await supabase.from('accounts').delete().eq('id', id);
  if (error) return toast('❌ ' + error.message);
  await loadAll(); render(); toast('🗑️ Deleted');
};
window.editTransaction = id => {
  const t = transactions.find(x => x.id===id); if (!t) return;
  currentTxnType = t.is_transfer ? 'transfer' : t.type;
  $('txnId').value = t.id;
  $('txnAmount').value = t.amount;
  $('txnDate').value = t.date;
  $('txnRemarks').value = t.remarks || '';
  document.querySelectorAll('#txnTypeTabs .type-tab').forEach(b => b.classList.toggle('active', b.dataset.type===currentTxnType));
  $('txnTransferToField').style.display = currentTxnType==='transfer' ? '' : 'none';
  $('txnCategoryField').style.display = currentTxnType==='transfer' ? 'none' : '';
  accSelect('txnAccount'); accSelect('txnTransferTo', 'Transfer to…');
  catSelect('txnCategory', currentTxnType==='transfer' ? 'expense' : currentTxnType);
  $('txnAccount').value = t.account_id || '';
  $('txnTransferTo').value = t.transfer_to_account_id || '';
  $('txnCategory').value = t.category_id || '';
  $('txnModalTitle').textContent = 'Edit Transaction';
  openModal('txnModal');
};
window.deleteTransaction = async id => {
  if (!confirm('Delete this transaction?')) return;
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) return toast('❌ ' + error.message);
  await loadAll(); render(); toast('🗑️ Deleted');
};
window.openPayback = id => {
  $('paybackReimburseId').value = id;
  $('paybackAmount').value = '';
  $('paybackDate').value = today();
  $('paybackRemarks').value = '';
  accSelect('paybackAccount', 'Received into…');
  openModal('paybackModal');
};
window.deleteReimburse = async id => {
  if (!confirm('Delete?')) return;
  await supabase.from('reimbursements').delete().eq('id', id);
  await loadAll(); render(); toast('🗑️ Deleted');
};
window.deleteCat = async id => {
  if (!confirm('Delete?')) return;
  await supabase.from('categories').delete().eq('id', id);
  await loadAll(); render(); toast('🗑️ Deleted');
};

function expectedFields(k) {
  if (k==='transactions') return ['date','amount','type','category','account','note'];
  if (k==='transfers') return ['date','amount','from_account','to_account','note'];
  return ['date','original_amount','reimbursed','pending','status','category','paid_from_account','refund_to_account','note','Person_name'];
}

function parseCsv(text, delim) {
  const rows = []; let row=[], cell='', inQ=false;
  for (let i=0; i<text.length; i++) {
    const ch=text[i], nx=text[i+1];
    if (ch==='"') { if (inQ && nx==='"') { cell+='"'; i++; } else inQ=!inQ; }
    else if (ch===delim && !inQ) { row.push(cell); cell=''; }
    else if ((ch==='\n' || ch==='\r') && !inQ) { if (ch==='\r'&&nx==='\n') i++; row.push(cell); rows.push(row); row=[]; cell=''; }
    else cell+=ch;
  }
  if (row.length || cell) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(v => String(v).trim() !== ''));
}

function buildMappingGrid() {
  const box = $('mappingGrid'); if (!box) return;
  const fields = expectedFields(currentImportKind);
  box.innerHTML = '';
  fields.forEach(f => {
    const d = document.createElement('div'); d.className = 'mapping-card';
    d.innerHTML = `<label>${f}</label><select class="input import-map" data-target="${f}"><option value="">-- ignore --</option>${importHeaders.map(h=>`<option value="${h}">${h}</option>`).join('')}</select>`;
    box.appendChild(d);
  });
  autoMap();
}

function autoMap() {
  document.querySelectorAll('.import-map').forEach(sel => {
    const tgt = sel.dataset.target.toLowerCase();
    const m = importHeaders.find(h => h.trim().toLowerCase()===tgt) || importHeaders.find(h => h.trim().toLowerCase().includes(tgt));
    if (m) sel.value = m;
  });
}

function previewTable(rows) {
  const head = importHeaders;
  const body = rows.slice(0,8).map(r => `<tr>${head.map((_,i) => `<td>${String(r[i]||'').replace(/</g,'&lt;')}</td>`).join('')}</tr>`).join('');
  return `<table class="mini-preview-table"><thead><tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table>`;
}

function getMapping() {
  const m = {};
  document.querySelectorAll('.import-map').forEach(s => { if (s.value) m[s.dataset.target] = s.value; });
  return m;
}

async function doPreview() {
  const file = $('importFile')?.files[0]; if (!file) return toast('Choose a CSV file');
  const raw = $('importDelimiter').value;
  const delim = raw === '\\t' ? '\t' : raw;
  const skipS = Number($('importSkipStart')?.value||0);
  const skipE = Number($('importSkipEnd')?.value||0);
  const hasH = $('importHasHeader')?.checked ?? true;
  const text = await file.text();
  let rows = parseCsv(text, delim).slice(skipS);
  if (skipE > 0) rows = rows.slice(0, Math.max(0, rows.length - skipE));
  if (!rows.length) { $('importPreview').textContent = 'No rows found.'; return; }
  importHeaders = (hasH ? rows[0] : rows[0].map((_,i) => `Column ${i+1}`)).map(h => String(h).trim());
  importRows = hasH ? rows.slice(1) : rows;
  $('importPreview').innerHTML = previewTable(importRows);
  buildMappingGrid();
  toast(`Preview: ${importRows.length} rows`);
}

async function runImport() {
  if (!importRows.length) return toast('Preview CSV first');
  const mp = getMapping();
  const merge = $('importMergeExisting')?.checked ?? true;
  const clearBef = $('importClearBefore')?.checked ?? false;
  const flip = $('importFlipAmount')?.checked ?? false;
  const useType = $('importUseTypeColumn')?.checked ?? true;
  if (clearBef && currentImportKind !== 'reimburse') await supabase.from('transactions').delete().eq('user_id', USER.id);
  if (clearBef && currentImportKind === 'reimburse') await supabase.from('reimbursements').delete().eq('user_id', USER.id);
  const existing = new Set(transactions.map(dedupeKey));
  let inserted=0, skipped=0;

  if (currentImportKind === 'transactions') {
    const payload = [];
    for (const row of importRows) {
      const obj = Object.fromEntries(importHeaders.map((h,i) => [h, row[i]??'']));
      let amount = Math.abs(Number(obj[mp.amount]||0)); if (flip) amount = Math.abs(-amount);
      if (!amount) { skipped++; continue; }
      let type = 'expense';
      if (useType && mp.type) { const raw2 = String(obj[mp.type]||'').toLowerCase(); type = (raw2.includes('income')||raw2.includes('inflow')) ? 'income' : 'expense'; }
      const acc = findAccount(obj[mp.account]); if (!acc) { skipped++; continue; }
      const cat = findCategory(obj[mp.category], type);
      const item = { user_id:USER.id, date:parseDate(obj[mp.date]), amount, type, category_id:cat?.id||null, account_id:acc.id, remarks:obj[mp.note]||'', is_transfer:false, transfer_to_account_id:null };
      const fp = dedupeKey(item); if (merge && existing.has(fp)) { skipped++; continue; }
      existing.add(fp); payload.push(item);
    }
    if (payload.length) { const {error} = await supabase.from('transactions').insert(payload); if (error) return toast('❌ '+error.message); inserted = payload.length; }
  }

  if (currentImportKind === 'transfers') {
    const payload = [];
    for (const row of importRows) {
      const obj = Object.fromEntries(importHeaders.map((h,i) => [h, row[i]??'']));
      const amount = Math.abs(Number(obj[mp.amount]||0)); if (!amount) { skipped++; continue; }
      const from = findAccount(obj[mp.from_account]), to = findAccount(obj[mp.to_account]);
      if (!from || !to || from.id===to.id) { skipped++; continue; }
      const item = { user_id:USER.id, date:parseDate(obj[mp.date]), amount, type:'transfer', category_id:null, account_id:from.id, remarks:obj[mp.note]||'', is_transfer:true, transfer_to_account_id:to.id };
      const fp = dedupeKey(item); if (merge && existing.has(fp)) { skipped++; continue; }
      existing.add(fp); payload.push(item);
    }
    if (payload.length) { const {error} = await supabase.from('transactions').insert(payload); if (error) return toast('❌ '+error.message); inserted = payload.length; }
  }

  if (currentImportKind === 'reimburse') {
    for (const row of importRows) {
      const obj = Object.fromEntries(importHeaders.map((h,i) => [h, row[i]??'']));
      const person = (obj[mp.Person_name]||obj[mp.person_name]||'').trim();
      const total = Number(obj[mp.original_amount]||0);
      const paid = Number(obj[mp.reimbursed]||0);
      if (!person || !total) { skipped++; continue; }
      const pending = Number(obj[mp.pending] || Math.max(0, total-paid));
      const status = pending<=0 ? 'settled' : paid>0 ? 'partial' : 'pending';
      const {data:rb, error} = await supabase.from('reimbursements').insert({user_id:USER.id,person_name:person,total_amount:total,paid_back:paid,status}).select().single();
      if (error) { skipped++; continue; }
      inserted++;
      const accFrom = findAccount(obj[mp.paid_from_account]);
      const accTo = findAccount(obj[mp.refund_to_account]);
      const note = obj[mp.note]||'';
      if (accFrom) await supabase.from('transactions').insert({user_id:USER.id,account_id:accFrom.id,amount:total,type:'expense',date:parseDate(obj[mp.date]),remarks:note||`Reimburse: ${person}`,is_transfer:false,reimburse_id:rb.id});
      if (paid>0 && accTo) await supabase.from('transactions').insert({user_id:USER.id,account_id:accTo.id,amount:paid,type:'income',date:parseDate(obj[mp.date]),remarks:`Payback from ${person}`,is_transfer:false});
    }
  }

  await loadAll(); render(); closeModal('importModal');
  toast(`✅ Imported ${inserted}, skipped ${skipped}`);
}

(async () => {
  const saved = localStorage.getItem('flowledger-theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  $('themeBtn').onclick = () => {
    const next = document.documentElement.getAttribute('data-theme')==='dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('flowledger-theme', next);
  };

  $('menuBtn').onclick = () => document.body.classList.toggle('sidebar-open');
  $('sidebarOverlay').onclick = () => document.body.classList.remove('sidebar-open');

  document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => closeModal(b.dataset.close));
  document.querySelectorAll('.modal-backdrop').forEach(m => m.onclick = e => { if (e.target===m) closeModal(m.id); });

  window.addEventListener('hashchange', render);

  $('logoutBtn').onclick = async () => { await supabase.auth.signOut(); location.href='./login.html'; };

  $('saveProfileBtn').onclick = async () => {
    const name = $('settingName').value.trim(), currency = $('settingCurrency').value;
    if (!name) return toast('Enter a name');
    const { error } = await supabase.from('profiles').upsert({id:USER.id,name,currency},{onConflict:'id'});
    if (error) return toast('❌ '+error.message);
    profile = {...profile, name, currency}; renderProfile(); toast('✅ Profile saved');
  };

  $('addAccountBtn').onclick = () => {
    $('accountId').value=''; $('accountIcon').value=''; $('accountName').value=''; $('accountType').value='bank'; $('accountBalance').value='0';
    $('accountModalTitle').textContent='New Account'; openModal('accountModal');
  };
  $('saveAccountBtn').onclick = async () => {
    const id = $('accountId').value;
    const row = { user_id:USER.id, emoji:$('accountIcon').value.trim()||'', name:$('accountName').value.trim(), type:$('accountType').value, opening_balance:parseFloat($('accountBalance').value)||0 };
    if (!row.name) return toast('Enter account name');
    const q = id ? supabase.from('accounts').update(row).eq('id',id) : supabase.from('accounts').insert(row);
    const { error } = await q; if (error) return toast('❌ '+error.message);
    closeModal('accountModal'); await loadAll(); render(); toast(id ? '✅ Updated' : '✅ Account added');
  };

  function openTxnModal() {
    $('txnId').value=''; $('txnAmount').value=''; $('txnRemarks').value=''; $('txnDate').value=today(); currentTxnType='expense';
    document.querySelectorAll('#txnTypeTabs .type-tab').forEach(b => b.classList.toggle('active', b.dataset.type==='expense'));
    $('txnTransferToField').style.display='none'; $('txnCategoryField').style.display='';
    accSelect('txnAccount'); accSelect('txnTransferTo','Transfer to…'); catSelect('txnCategory','expense');
    $('txnModalTitle').textContent='Add Transaction'; openModal('txnModal');
  }

  $('addTxnBtn').onclick = openTxnModal;
  $('quickAddBtn').onclick = openTxnModal;
  $('fabBtn').onclick = openTxnModal;

  document.querySelectorAll('#txnTypeTabs .type-tab').forEach(btn => btn.onclick = () => {
    document.querySelectorAll('#txnTypeTabs .type-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active'); currentTxnType = btn.dataset.type;
    $('txnTransferToField').style.display = currentTxnType==='transfer' ? '' : 'none';
    $('txnCategoryField').style.display = currentTxnType==='transfer' ? 'none' : '';
    if (currentTxnType !== 'transfer') catSelect('txnCategory', currentTxnType);
  });

    $('saveTxnBtn').onclick = async () => {
      const id = $('txnId').value;
      const amount = parseFloat($('txnAmount').value);
      const account_id = $('txnAccount').value;
      const date = $('txnDate').value;
      const remarks = $('txnRemarks').value.trim();
      const category_id = $('txnCategory').value || null;
      const transfer_to = $('txnTransferTo').value || null;
      if (!amount || amount<=0) return toast('Enter valid amount');
      if (!account_id) return toast('Select account');
      if (!date) return toast('Pick a date');
      if (currentTxnType==='transfer' && !transfer_to) return toast('Select destination account');
      if (currentTxnType==='transfer' && transfer_to===account_id) return toast('Source and destination cannot match');
      const row = { user_id:USER.id, account_id, category_id:currentTxnType==='transfer'?null:category_id, amount, date, remarks, type:currentTxnType, is_transfer:currentTxnType==='transfer', transfer_to_account_id:currentTxnType==='transfer'?transfer_to:null };
      const q = id ? supabase.from('transactions').update(row).eq('id',id) : supabase.from('transactions').insert(row);
      const { error } = await q; if (error) return toast('❌ '+error.message);
      closeModal('txnModal'); await loadAll(); render(); toast(id ? '✅ Updated' : '✅ Saved');
    };

    ['txnFilterType','txnFilterAccount','txnFilterMonth'].forEach(id => $(id)?.addEventListener('change', renderTransactions));

    $('addReimburseBtn').onclick = () => {
      $('reimbPersonName').value=''; $('reimbAmount').value=''; $('reimbRemarks').value=''; $('reimbDate').value=today();
      accSelect('reimbAccount'); openModal('reimburseModal');
    };
    $('saveReimburseBtn').onclick = async () => {
      const person_name = $('reimbPersonName').value.trim();
      const total_amount = parseFloat($('reimbAmount').value);
      const account_id = $('reimbAccount').value;
      const date = $('reimbDate').value;
      const remarks = $('reimbRemarks').value.trim();
      if (!person_name || !total_amount || !account_id) return toast('Fill all fields');
      const {data:rb, error} = await supabase.from('reimbursements').insert({user_id:USER.id,person_name,total_amount,paid_back:0,status:'pending'}).select().single();
      if (error) return toast('❌ '+error.message);
      await supabase.from('transactions').insert({user_id:USER.id,account_id,amount:total_amount,type:'expense',date,remarks:remarks||`Reimburse: ${person_name}`,is_transfer:false,reimburse_id:rb.id});
      closeModal('reimburseModal'); await loadAll(); render(); toast('✅ Added');
    };

    $('savePaybackBtn').onclick = async () => {
      const id = $('paybackReimburseId').value;
      const amount = parseFloat($('paybackAmount').value);
      const account_id = $('paybackAccount').value;
      const date = $('paybackDate').value;
      const remarks = $('paybackRemarks').value.trim();
      if (!amount || !account_id) return toast('Fill all fields');
      const rb = reimbursements.find(r => r.id===id);
      const newPaid = Number(rb.paid_back||0) + amount;
      const status = newPaid >= Number(rb.total_amount) ? 'settled' : 'partial';
      await supabase.from('reimbursements').update({paid_back:newPaid,status}).eq('id',id);
      await supabase.from('transactions').insert({user_id:USER.id,account_id,amount,type:'income',date,remarks:remarks||`Payback from ${rb.person_name}`,is_transfer:false});
      closeModal('paybackModal'); await loadAll(); render(); toast('✅ Payback recorded');
    };

    $('addCategoryBtn').onclick = () => {
      $('catIcon').value=''; $('catName').value=''; currentCatType='expense';
      document.querySelectorAll('[data-ctype]').forEach(b => b.classList.toggle('active', b.dataset.ctype==='expense'));
      openModal('categoryModal');
    };
    document.querySelectorAll('[data-ctype]').forEach(btn => btn.onclick = () => {
      document.querySelectorAll('[data-ctype]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active'); currentCatType = btn.dataset.ctype;
    });
    $('saveCategoryBtn').onclick = async () => {
      const name = $('catName').value.trim(); if (!name) return toast('Enter category name');
      const {error} = await supabase.from('categories').insert({user_id:USER.id,name,emoji:$('catIcon').value.trim()||'',type:currentCatType,color:'#01696f',is_default:false});
      if (error) return toast('❌ '+error.message);
      closeModal('categoryModal'); await loadAll(); render(); toast('✅ Category added');
    };

    $('addLedgerPersonBtn').onclick = () => toast('Ledger coming soon');
    $('addRecurringBtn').onclick = () => toast('Recurring coming soon');

    $('exportCsvBtn').onclick = () => {
      const header = 'Date,Type,Amount,Category,Account,Remarks';
      const rows = transactions.map(t => {
        const cat = categories.find(c=>c.id===t.category_id), acc = accounts.find(a=>a.id===t.account_id);
        return [t.date, t.type, t.amount, cat?.name||'', acc?.name||'', JSON.stringify(t.remarks||'')].join(',');
      });
      const csv = [header, ...rows].join('\n');
      const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,'+encodeURIComponent(csv); a.download = `flowledger_${today()}.csv`; a.click();
      toast('✅ Exported');
    };

    document.querySelectorAll('[data-import-kind]').forEach(b => b.onclick = () => {
      document.querySelectorAll('[data-import-kind]').forEach(x => x.classList.remove('active'));
      b.classList.add('active'); currentImportKind = b.dataset.importKind; buildMappingGrid();
    });

    $('openTxnImportBtn').onclick = () => {
      currentImportKind='transactions'; importRows=[]; importHeaders=[]; $('importPreview').textContent='Upload a CSV to preview rows.'; $('mappingGrid').innerHTML='';
      document.querySelectorAll('[data-import-kind]').forEach(b => b.classList.toggle('active', b.dataset.importKind==='transactions'));
      openModal('importModal');
    };
    $('openReimburseImportBtn').onclick = () => {
      currentImportKind='reimburse'; importRows=[]; importHeaders=[]; $('importPreview').textContent='Upload a CSV to preview rows.'; $('mappingGrid').innerHTML='';
      document.querySelectorAll('[data-import-kind]').forEach(b => b.classList.toggle('active', b.dataset.importKind==='reimburse'));
      openModal('importModal');
    };
    $('importFile').addEventListener('change', doPreview);
    $('previewImportBtn').onclick = doPreview;
    $('runImportBtn').onclick = runImport;

    document.querySelectorAll('[data-icon-group]').forEach(b => b.onclick = () => {
      document.querySelectorAll('[data-icon-group]').forEach(x => x.classList.remove('active'));
      b.classList.add('active'); renderIconGrid();
    });
    $('iconSearch').addEventListener('input', renderIconGrid);

    await loadAll();
    renderProfile();
    accSelect('txnAccount');
    accSelect('txnTransferTo');
    catSelect('txnCategory','expense');
    render();
})();
