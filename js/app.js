/**
 * app.js — FlowLedger SPA logic
 * Imports from supabase.js (already in your repo)
 */
import { supabase } from "./supabase.js";

/* ══════════════════════════════════════════════════════════════
   AUTH GUARD — redirect to login if not signed in
══════════════════════════════════════════════════════════════ */
const { data: { session } } = await supabase.auth.getSession();
if (!session) { window.location.replace("./login.html"); }
const USER = session.user;

/* ══════════════════════════════════════════════════════════════
   THEME TOGGLE
══════════════════════════════════════════════════════════════ */
const root = document.documentElement;
const themeBtn  = document.getElementById("themeBtn");
const themeIcon = document.getElementById("themeIcon");
const SUN  = `<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>`;
const MOON = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79"/>`;
let theme = window.matchMedia("(prefers-color-scheme:dark)").matches ? "dark" : "light";
function applyTheme(t){ root.setAttribute("data-theme",t); themeIcon.innerHTML = t==="dark"?SUN:MOON; }
applyTheme(theme);
themeBtn.addEventListener("click",()=>{ theme=theme==="dark"?"light":"dark"; applyTheme(theme); });

/* ══════════════════════════════════════════════════════════════
   SIDEBAR (mobile toggle)
══════════════════════════════════════════════════════════════ */
document.getElementById("menuBtn").addEventListener("click",()=>
  document.body.classList.toggle("sidebar-open"));
document.getElementById("sidebarOverlay").addEventListener("click",()=>
  document.body.classList.remove("sidebar-open"));

/* ══════════════════════════════════════════════════════════════
   ROUTER
══════════════════════════════════════════════════════════════ */
const ROUTES = {
  dashboard:    { title:"Dashboard",    sub:"Your money overview at a glance." },
  accounts:     { title:"Accounts",     sub:"Track balances across all accounts." },
  transactions: { title:"Transactions", sub:"Income, expense, and transfer history." },
  reimburse:    { title:"Reimburse",    sub:"Track money others still owe you." },
  ledger:       { title:"Ledger",       sub:"Manage long-term borrow and lend." },
  recurring:    { title:"Recurring",    sub:"Bills, subscriptions, and reminders." },
  reports:      { title:"Reports",      sub:"Monthly trends and category totals." },
  settings:     { title:"Settings",     sub:"Profile, categories, and preferences." },
};

function getRoute(){ const r=location.hash.replace("#",""); return ROUTES[r]?r:"dashboard"; }

function renderRoute(){
  const route = getRoute();
  const meta  = ROUTES[route];
  document.getElementById("pageTitle").textContent = meta.title;
  document.getElementById("pageSub").textContent   = meta.sub;
  document.querySelectorAll("[data-view]").forEach(el=>
    el.classList.toggle("active", el.dataset.view===route));
  document.querySelectorAll("[data-route]").forEach(el=>
    el.classList.toggle("active", el.dataset.route===route));
  document.body.classList.remove("sidebar-open");

  if(route==="dashboard")    renderDashboard();
  if(route==="accounts")     renderAccounts();
  if(route==="transactions") renderTransactions();
  if(route==="reimburse")    renderReimburse();
  if(route==="ledger")       renderLedger();
  if(route==="recurring")    renderRecurring();
  if(route==="reports")      renderReports();
  if(route==="settings")     renderSettings();
}

window.addEventListener("hashchange", renderRoute);

/* ══════════════════════════════════════════════════════════════
   STATE  (in-memory cache, refreshed on each route visit)
══════════════════════════════════════════════════════════════ */
let accounts=[], categories=[], transactions=[], reimbursements=[],
    reimburse_payments=[], ledger_people=[], ledger_entries=[],
    ledger_payments=[], recurring_rules=[], profile={};

async function loadAll(){
  const uid = USER.id;
  const [
    {data:ac},{data:ca},{data:tx},{data:rb},{data:rp},
    {data:lp},{data:le},{data:lpay},{data:rr},{data:pr}
  ] = await Promise.all([
    supabase.from("accounts").select("*").eq("user_id",uid).eq("is_archived",false).order("created_at"),
    supabase.from("categories").select("*").eq("user_id",uid).order("type").order("name"),
    supabase.from("transactions").select("*").eq("user_id",uid).order("date",{ascending:false}).order("created_at",{ascending:false}).limit(300),
    supabase.from("reimbursements").select("*").eq("user_id",uid).order("created_at",{ascending:false}),
    supabase.from("reimburse_payments").select("*").eq("user_id",uid),
    supabase.from("ledger_people").select("*").eq("user_id",uid).order("person_name"),
    supabase.from("ledger_entries").select("*").eq("user_id",uid).order("date",{ascending:false}),
    supabase.from("ledger_payments").select("*").eq("user_id",uid),
    supabase.from("recurring_rules").select("*").eq("user_id",uid).eq("is_active",true).order("next_due"),
    supabase.from("profiles").select("*").eq("id",uid).single(),
  ]);
  accounts=ac||[]; categories=ca||[]; transactions=tx||[];
  reimbursements=rb||[]; reimburse_payments=rp||[];
  ledger_people=lp||[]; ledger_entries=le||[]; ledger_payments=lpay||[];
  recurring_rules=rr||[]; profile=pr||{};
}

/* ══════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════ */
function fmt(n, symbol="₹"){ return symbol + Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:0,maximumFractionDigits:2}); }

function accountBalance(id){
  const acc = accounts.find(a=>a.id===id);
  if(!acc) return 0;
  let bal = Number(acc.opening_balance||0);
  transactions.forEach(t=>{
    if(t.is_transfer){
      if(t.account_id===id) bal -= Number(t.amount);
      if(t.transfer_to_account_id===id) bal += Number(t.amount);
    } else {
      if(t.account_id!==id) return;
      if(t.type==="income")  bal += Number(t.amount);
      if(t.type==="expense") bal -= Number(t.amount);
    }
  });
  return bal;
}

function today(){ return new Date().toISOString().split("T")[0]; }

function thisMonthTxns(){
  const now=new Date(); const ym=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  return transactions.filter(t=>t.date&&t.date.startsWith(ym));
}

function toast(msg, dur=2500){
  const el=document.getElementById("toast");
  el.textContent=msg; el.classList.remove("hidden");
  clearTimeout(toast._t);
  toast._t=setTimeout(()=>el.classList.add("hidden"),dur);
}

function openModal(id){ document.getElementById(id).classList.remove("hidden"); }
function closeModal(id){ document.getElementById(id).classList.add("hidden"); }

// Wire all [data-close] buttons
document.querySelectorAll("[data-close]").forEach(btn=>
  btn.addEventListener("click",()=>closeModal(btn.dataset.close)));

// Close on backdrop click
document.querySelectorAll(".modal-backdrop").forEach(bd=>
  bd.addEventListener("click",e=>{ if(e.target===bd) closeModal(bd.id); }));

function populateAccountSelect(selId, placeholder="Select account"){
  const sel=document.getElementById(selId);
  sel.innerHTML=`<option value="">${placeholder}</option>`;
  accounts.forEach(a=>{ const o=document.createElement("option"); o.value=a.id;
    o.textContent=`${a.emoji} ${a.name}`; sel.appendChild(o); });
}

function populateCategorySelect(selId, type="expense"){
  const sel=document.getElementById(selId);
  sel.innerHTML=`<option value="">No category</option>`;
  categories.filter(c=>c.type===type).forEach(c=>{
    const o=document.createElement("option"); o.value=c.id;
    o.textContent=`${c.emoji} ${c.name}`; sel.appendChild(o); });
}

/* ══════════════════════════════════════════════════════════════
   PROFILE (load into sidebar + settings)
══════════════════════════════════════════════════════════════ */
function renderProfile(){
  const name = profile.name || USER.email?.split("@")[0] || "User";
  document.getElementById("userName").textContent  = name;
  document.getElementById("userEmail").textContent = USER.email||"";
  document.getElementById("userAvatar").textContent= name[0].toUpperCase();
  document.getElementById("settingName").value     = name;
  document.getElementById("settingCurrency").value = profile.currency||"INR";
}

document.getElementById("saveProfileBtn").addEventListener("click", async()=>{
  const name=document.getElementById("settingName").value.trim();
  const currency=document.getElementById("settingCurrency").value;
  if(!name){ toast("Enter a name"); return; }
  const {error}=await supabase.from("profiles").upsert({id:USER.id,name,currency},{onConflict:"id"});
  if(error){ toast("❌ "+error.message); return; }
  profile={...profile,name,currency};
  renderProfile(); toast("✅ Profile saved");
});

/* ══════════════════════════════════════════════════════════════
   LOGOUT
══════════════════════════════════════════════════════════════ */
document.getElementById("logoutBtn").addEventListener("click",async()=>{
  await supabase.auth.signOut();
  window.location.replace("./login.html");
});

/* ══════════════════════════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════════════════════════ */
function renderDashboard(){
  // KPIs
  const totalBal = accounts.reduce((s,a)=>s+accountBalance(a.id),0);
  const mtx = thisMonthTxns();
  const income  = mtx.filter(t=>t.type==="income"  && !t.is_transfer).reduce((s,t)=>s+Number(t.amount),0);
  const expense = mtx.filter(t=>t.type==="expense" && !t.is_transfer).reduce((s,t)=>s+Number(t.amount),0);
  const rDue    = reimbursements.filter(r=>r.status!=="settled")
                    .reduce((s,r)=>s+(Number(r.total_amount)-Number(r.paid_back)),0);
  document.getElementById("kpiBalance").textContent    = fmt(totalBal);
  document.getElementById("kpiIncome").textContent     = fmt(income);
  document.getElementById("kpiExpense").textContent    = fmt(expense);
  document.getElementById("kpiReimburse").textContent  = fmt(rDue);
  document.getElementById("kpiAccounts").textContent   = `${accounts.length} account${accounts.length!==1?"s":""}`;

  // Recent transactions (last 8)
  const rList = document.getElementById("dashRecentList");
  const recent = transactions.slice(0,8);
  rList.innerHTML = recent.length
    ? recent.map(t=>txnHTML(t)).join("")
    : `<div class="empty-state">No transactions yet.</div>`;

  // Accounts list
  const aList = document.getElementById("dashAccountsList");
  aList.innerHTML = accounts.length
    ? accounts.map(a=>`
      <div class="txn-item">
        <div class="txn-icon transfer">${a.emoji}</div>
        <div class="txn-meta">
          <div class="txn-cat">${a.name}</div>
          <div class="txn-sub">${a.type}</div>
        </div>
        <div class="txn-right">
          <div class="txn-amount">${fmt(accountBalance(a.id))}</div>
        </div>
      </div>`).join("")
    : `<div class="empty-state">No accounts yet.</div>`;
}

/* ══════════════════════════════════════════════════════════════
   ACCOUNTS
══════════════════════════════════════════════════════════════ */
function renderAccounts(){
  const list=document.getElementById("accountsList");
  if(!accounts.length){ list.innerHTML=`<div class="empty-state">No accounts yet.</div>`; return; }
  list.innerHTML=accounts.map(a=>{
    const bal=accountBalance(a.id);
    return `<article class="account-card">
      <div class="account-emoji">${a.emoji}</div>
      <div class="account-name">${a.name}</div>
      <div class="account-type">${a.type}</div>
      <div class="account-balance" style="color:${bal<0?'var(--color-red)':'var(--color-text)'}">${fmt(bal)}</div>
      <div class="account-actions">
        <button class="btn-sm" onclick="editAccount('${a.id}')">Edit</button>
        <button class="btn-danger" onclick="deleteAccount('${a.id}')">Delete</button>
      </div>
    </article>`;
  }).join("");
}

document.getElementById("addAccountBtn").addEventListener("click",()=>{
  document.getElementById("accountId").value="";
  document.getElementById("accountEmoji").value="💳";
  document.getElementById("accountName").value="";
  document.getElementById("accountType").value="bank";
  document.getElementById("accountBalance").value="0";
  document.getElementById("accountModalTitle").textContent="New Account";
  openModal("accountModal");
});

window.editAccount=function(id){
  const a=accounts.find(x=>x.id===id); if(!a) return;
  document.getElementById("accountId").value=a.id;
  document.getElementById("accountEmoji").value=a.emoji;
  document.getElementById("accountName").value=a.name;
  document.getElementById("accountType").value=a.type;
  document.getElementById("accountBalance").value=a.opening_balance;
  document.getElementById("accountModalTitle").textContent="Edit Account";
  openModal("accountModal");
};

window.deleteAccount=async function(id){
  if(!confirm("Delete this account? All transactions linked to it will be removed.")) return;
  const{error}=await supabase.from("accounts").delete().eq("id",id);
  if(error){ toast("❌ "+error.message); return; }
  await loadAll(); renderAccounts(); renderDashboard(); toast("🗑️ Account deleted");
};

document.getElementById("saveAccountBtn").addEventListener("click",async()=>{
  const id=document.getElementById("accountId").value;
  const emoji=document.getElementById("accountEmoji").value.trim()||"💳";
  const name=document.getElementById("accountName").value.trim();
  const type=document.getElementById("accountType").value;
  const opening_balance=parseFloat(document.getElementById("accountBalance").value)||0;
  if(!name){ toast("Enter account name"); return; }
  const row={user_id:USER.id,emoji,name,type,opening_balance};
  let error;
  if(id){ ({error}=await supabase.from("accounts").update(row).eq("id",id)); }
  else   { ({error}=await supabase.from("accounts").insert(row)); }
  if(error){ toast("❌ "+error.message); return; }
  closeModal("accountModal"); await loadAll(); renderAccounts(); renderDashboard();
  toast(id?"✅ Account updated":"✅ Account added");
});

/* ══════════════════════════════════════════════════════════════
   TRANSACTIONS
══════════════════════════════════════════════════════════════ */
function txnHTML(t){
  const cat=categories.find(c=>c.id===t.category_id);
  const acc=accounts.find(a=>a.id===t.account_id);
  const to =accounts.find(a=>a.id===t.transfer_to_account_id);
  const icon = t.is_transfer ? "🔄" : (cat?.emoji||"💸");
  const type = t.is_transfer ? "transfer" : t.type;
  const label= t.is_transfer
    ? `${acc?.name||"?"} → ${to?.name||"?"}`
    : (cat?.name||"Uncategorised");
  const sub  = [acc?.name, t.remarks].filter(Boolean).join(" · ");
  const amtSign = t.is_transfer ? "" : (t.type==="income"?"+":"-");
  const amtClass= `amount-${type}`;
  return `<div class="txn-item">
    <div class="txn-icon ${type}">${icon}</div>
    <div class="txn-meta">
      <div class="txn-cat">${label}</div>
      <div class="txn-sub">${sub||""}</div>
    </div>
    <div class="txn-right">
      <div class="txn-amount ${amtClass}">${amtSign}${fmt(t.amount)}</div>
      <div class="txn-date">${t.date}</div>
    </div>
  </div>`;
}

function renderTransactions(){
  const type  = document.getElementById("txnFilterType").value;
  const accId = document.getElementById("txnFilterAccount").value;
  const month = document.getElementById("txnFilterMonth").value;

  // Populate account filter
  const sel=document.getElementById("txnFilterAccount");
  const prev=sel.value;
  sel.innerHTML=`<option value="">All accounts</option>`;
  accounts.forEach(a=>{ const o=document.createElement("option"); o.value=a.id;
    o.textContent=`${a.emoji} ${a.name}`; sel.appendChild(o); });
  sel.value=prev;

  let list=[...transactions];
  if(type)  list=list.filter(t=>t.is_transfer?(type==="transfer"):t.type===type);
  if(accId) list=list.filter(t=>t.account_id===accId||t.transfer_to_account_id===accId);
  if(month) list=list.filter(t=>t.date&&t.date.startsWith(month));

  document.getElementById("txnList").innerHTML = list.length
    ? list.map(t=>txnHTML(t)).join("")
    : `<div class="empty-state">No transactions match these filters.</div>`;
}

["txnFilterType","txnFilterAccount","txnFilterMonth"].forEach(id=>
  document.getElementById(id).addEventListener("change",renderTransactions));

// Transaction modal open
function openTxnModal(){
  document.getElementById("txnId").value="";
  document.getElementById("txnAmount").value="";
  document.getElementById("txnRemarks").value="";
  document.getElementById("txnDate").value=today();
  document.getElementById("txnModalTitle").textContent="Add Transaction";
  populateAccountSelect("txnAccount");
  populateAccountSelect("txnTransferTo","Transfer to…");
  populateCategorySelect("txnCategory","expense");
  document.getElementById("txnTransferToField").style.display="none";
  document.getElementById("txnCategoryField").style.display="";
  // reset type tabs
  document.querySelectorAll("#txnTypeTabs .type-tab").forEach(b=>b.classList.toggle("active",b.dataset.type==="expense"));
  openModal("txnModal");
}

document.getElementById("addTxnBtn").addEventListener("click",openTxnModal);
document.getElementById("quickAddBtn").addEventListener("click",openTxnModal);
document.getElementById("fabBtn").addEventListener("click",openTxnModal);

// Type tab switching
let currentTxnType="expense";
document.querySelectorAll("#txnTypeTabs .type-tab").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll("#txnTypeTabs .type-tab").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    currentTxnType=btn.dataset.type;
    const isTransfer=currentTxnType==="transfer";
    document.getElementById("txnTransferToField").style.display=isTransfer?"":"none";
    document.getElementById("txnCategoryField").style.display=isTransfer?"none":"";
    if(!isTransfer) populateCategorySelect("txnCategory",currentTxnType);
  });
});

document.getElementById("saveTxnBtn").addEventListener("click",async()=>{
  const amount=parseFloat(document.getElementById("txnAmount").value);
  const account_id=document.getElementById("txnAccount").value;
  const date=document.getElementById("txnDate").value;
  const remarks=document.getElementById("txnRemarks").value.trim();
  const category_id=document.getElementById("txnCategory").value||null;
  const transfer_to=document.getElementById("txnTransferTo").value||null;

  if(!amount||amount<=0){ toast("Enter a valid amount"); return; }
  if(!account_id){ toast("Select an account"); return; }
  if(!date){ toast("Pick a date"); return; }
  if(currentTxnType==="transfer" && !transfer_to){ toast("Select destination account"); return; }
  if(currentTxnType==="transfer" && transfer_to===account_id){ toast("Source and destination can't be the same"); return; }

  const row={
    user_id:USER.id, account_id, category_id, amount, date, remarks,
    type: currentTxnType==="transfer"?"transfer":currentTxnType,
    is_transfer: currentTxnType==="transfer",
    transfer_to_account_id: currentTxnType==="transfer"?transfer_to:null,
  };

  const{error}=await supabase.from("transactions").insert(row);
  if(error){ toast("❌ "+error.message); return; }
  closeModal("txnModal"); await loadAll(); renderTransactions(); renderDashboard();
  toast("✅ Transaction saved");
});

/* ══════════════════════════════════════════════════════════════
   REIMBURSE
══════════════════════════════════════════════════════════════ */
function renderReimburse(){
  const list=document.getElementById("reimburseList");
  if(!reimbursements.length){ list.innerHTML=`<div class="empty-state">No reimbursements yet.</div>`; return; }
  list.innerHTML=reimbursements.map(r=>{
    const pct=Math.min(100,Math.round((Number(r.paid_back)/Number(r.total_amount))*100));
    const badge=`<span class="badge badge-${r.status}">${r.status}</span>`;
    const due=Number(r.total_amount)-Number(r.paid_back);
    return `<div class="reimb-item">
      <div class="reimb-head">
        <div>
          <div class="reimb-name">👤 ${r.person_name}</div>
          <div class="reimb-total">Total: ${fmt(r.total_amount)} · Paid back: ${fmt(r.paid_back)} · Due: ${fmt(due)}</div>
        </div>
        ${badge}
      </div>
      <div class="progress-bar-wrap"><div class="progress-bar" style="width:${pct}%"></div></div>
      <div class="reimb-actions">
        ${r.status!=="settled"?`<button class="btn-sm" onclick="openPayback('${r.id}')">Record payback</button>`:""}
        <button class="btn-danger" onclick="deleteReimburse('${r.id}')">Delete</button>
      </div>
    </div>`;
  }).join("");
}

document.getElementById("addReimburseBtn").addEventListener("click",()=>{
  document.getElementById("reimbPersonName").value="";
  document.getElementById("reimbAmount").value="";
  document.getElementById("reimbRemarks").value="";
  document.getElementById("reimbDate").value=today();
  populateAccountSelect("reimbAccount");
  openModal("reimburseModal");
});

document.getElementById("saveReimburseBtn").addEventListener("click",async()=>{
  const person_name=document.getElementById("reimbPersonName").value.trim();
  const total_amount=parseFloat(document.getElementById("reimbAmount").value);
  const account_id=document.getElementById("reimbAccount").value;
  const date=document.getElementById("reimbDate").value;
  const remarks=document.getElementById("reimbRemarks").value.trim();
  if(!person_name){ toast("Enter person name"); return; }
  if(!total_amount||total_amount<=0){ toast("Enter valid amount"); return; }
  if(!account_id){ toast("Select account"); return; }

  // Insert reimbursement
  const{data:rb,error:re}=await supabase.from("reimbursements").insert({
    user_id:USER.id,person_name,total_amount,paid_back:0,status:"pending"
  }).select().single();
  if(re){ toast("❌ "+re.message); return; }

  // Also create a transaction for the spend
  await supabase.from("transactions").insert({
    user_id:USER.id,account_id,amount:total_amount,type:"expense",date,remarks:remarks||`Reimburse: ${person_name}`,
    is_transfer:false,reimburse_id:rb.id
  });

  closeModal("reimburseModal"); await loadAll(); renderReimburse(); renderDashboard();
  toast("✅ Reimbursement added");
});

window.openPayback=function(reimburseId){
  document.getElementById("paybackReimburseId").value=reimburseId;
  document.getElementById("paybackAmount").value="";
  document.getElementById("paybackRemarks").value="";
  document.getElementById("paybackDate").value=today();
  populateAccountSelect("paybackAccount","Received into…");
  openModal("paybackModal");
};

document.getElementById("savePaybackBtn").addEventListener("click",async()=>{
  const reimburse_id=document.getElementById("paybackReimburseId").value;
  const amount=parseFloat(document.getElementById("paybackAmount").value);
  const account_id=document.getElementById("paybackAccount").value;
  const date=document.getElementById("paybackDate").value;
  const remarks=document.getElementById("paybackRemarks").value.trim();
  if(!amount||amount<=0){ toast("Enter amount"); return; }
  if(!account_id){ toast("Select account"); return; }

  const rb=reimbursements.find(r=>r.id===reimburse_id);
  const newPaid=Number(rb.paid_back)+amount;
  const status=newPaid>=Number(rb.total_amount)?"settled":"partial";

  // Insert payback record
  await supabase.from("reimburse_payments").insert({user_id:USER.id,reimburse_id,amount,account_id,date,remarks});
  // Update totals
  await supabase.from("reimbursements").update({paid_back:newPaid,status}).eq("id",reimburse_id);
  // Add income transaction for the payback
  await supabase.from("transactions").insert({
    user_id:USER.id,account_id,amount,type:"income",date,
    remarks:remarks||`Payback from ${rb.person_name}`,is_transfer:false
  });

  closeModal("paybackModal"); await loadAll(); renderReimburse(); renderDashboard();
  toast("✅ Payback recorded");
});

window.deleteReimburse=async function(id){
  if(!confirm("Delete this reimbursement?")) return;
  await supabase.from("reimbursements").delete().eq("id",id);
  await loadAll(); renderReimburse(); toast("🗑️ Deleted");
};

/* ══════════════════════════════════════════════════════════════
   LEDGER
══════════════════════════════════════════════════════════════ */
function renderLedger(){
  const list=document.getElementById("ledgerList");
  if(!ledger_people.length){ list.innerHTML=`<div class="empty-state">No ledger entries yet.</div>`; return; }
  list.innerHTML=ledger_people.map(p=>{
    const entries=ledger_entries.filter(e=>e.person_id===p.id);
    const balance=entries.reduce((s,e)=>{
      const paid=ledger_payments.filter(lp=>lp.entry_id===e.id).reduce((a,x)=>a+Number(x.amount),0);
      const rem=Number(e.amount)-paid;
      return s+(e.type==="lent"?rem:-rem);
    },0);
    const balColor=balance>0?"var(--color-green)":balance<0?"var(--color-red)":"var(--color-text-muted)";
    const balLabel=balance>0?"they owe you":balance<0?"you owe them":"settled";
    return `<div class="ledger-person-card">
      <div class="lp-head">
        <div class="lp-emoji">${p.emoji}</div>
        <div>
          <div class="lp-name">${p.person_name}</div>
          <div style="font-size:var(--text-xs);color:var(--color-text-muted)">${p.notes||""}</div>
        </div>
        <div style="margin-left:auto;text-align:right">
          <div class="lp-balance" style="color:${balColor}">${fmt(Math.abs(balance))}</div>
          <div style="font-size:10px;color:var(--color-text-muted)">${balLabel}</div>
        </div>
      </div>
      <div class="lp-entries">
        ${entries.length?entries.map(e=>{
          const paid=ledger_payments.filter(lp=>lp.entry_id===e.id).reduce((a,x)=>a+Number(x.amount),0);
          return `<div class="le-row${e.is_settled?" le-settled":""}">
            <span>${e.type==="lent"?"↑ Lent":"↓ Borrowed"}</span>
            <span>${fmt(e.amount)}</span>
            <span style="font-size:10px;color:var(--color-text-muted)">${e.date}</span>
            <span style="font-size:10px;color:var(--color-text-muted)">${e.remarks||""}</span>
            ${!e.is_settled?`<button class="btn-sm" style="padding:2px 6px;font-size:10px" onclick="settleLedgerEntry('${e.id}')">Settle</button>`:""}
          </div>`;
        }).join("")
        :`<div class="empty-state" style="padding:var(--space-3)">No entries yet.</div>`}
      </div>
      <div style="display:flex;gap:var(--space-2);flex-wrap:wrap">
        <button class="btn-sm" onclick="openLedgerEntry('${p.id}')">+ Entry</button>
        <button class="btn-danger" onclick="deleteLedgerPerson('${p.id}')">Delete person</button>
      </div>
    </div>`;
  }).join("");
}

document.getElementById("addLedgerPersonBtn").addEventListener("click",()=>{
  document.getElementById("ledgerEmoji").value="🧑";
  document.getElementById("ledgerPersonName").value="";
  document.getElementById("ledgerNotes").value="";
  openModal("ledgerModal");
});

document.getElementById("saveLedgerPersonBtn").addEventListener("click",async()=>{
  const person_name=document.getElementById("ledgerPersonName").value.trim();
  const emoji=document.getElementById("ledgerEmoji").value.trim()||"🧑";
  const notes=document.getElementById("ledgerNotes").value.trim();
  if(!person_name){ toast("Enter name"); return; }
  const{error}=await supabase.from("ledger_people").insert({user_id:USER.id,person_name,emoji,notes});
  if(error){ toast("❌ "+error.message); return; }
  closeModal("ledgerModal"); await loadAll(); renderLedger(); toast("✅ Person added");
});

let currentLedgerType="lent";
document.querySelectorAll("[data-ledger-type]").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll("[data-ledger-type]").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active"); currentLedgerType=btn.dataset.ledgerType;
  });
});

window.openLedgerEntry=function(personId){
  document.getElementById("ledgerEntryPersonId").value=personId;
  document.getElementById("ledgerEntryAmount").value="";
  document.getElementById("ledgerEntryDate").value=today();
  document.getElementById("ledgerEntryRemarks").value="";
  currentLedgerType="lent";
  document.querySelectorAll("[data-ledger-type]").forEach(b=>b.classList.toggle("active",b.dataset.ledgerType==="lent"));
  openModal("ledgerEntryModal");
};

document.getElementById("saveLedgerEntryBtn").addEventListener("click",async()=>{
  const person_id=document.getElementById("ledgerEntryPersonId").value;
  const amount=parseFloat(document.getElementById("ledgerEntryAmount").value);
  const date=document.getElementById("ledgerEntryDate").value;
  const remarks=document.getElementById("ledgerEntryRemarks").value.trim();
  if(!amount||amount<=0){ toast("Enter amount"); return; }
  const{error}=await supabase.from("ledger_entries").insert({
    user_id:USER.id,person_id,amount,type:currentLedgerType,date,remarks,is_settled:false
  });
  if(error){ toast("❌ "+error.message); return; }
  closeModal("ledgerEntryModal"); await loadAll(); renderLedger(); toast("✅ Entry added");
});

window.settleLedgerEntry=async function(id){
  await supabase.from("ledger_entries").update({is_settled:true}).eq("id",id);
  await loadAll(); renderLedger(); toast("✅ Marked as settled");
};

window.deleteLedgerPerson=async function(id){
  if(!confirm("Delete this person and all their entries?")) return;
  await supabase.from("ledger_people").delete().eq("id",id);
  await loadAll(); renderLedger(); toast("🗑️ Deleted");
};

/* ══════════════════════════════════════════════════════════════
   RECURRING
══════════════════════════════════════════════════════════════ */
function renderRecurring(){
  const list=document.getElementById("recurringList");
  if(!recurring_rules.length){ list.innerHTML=`<div class="empty-state">No recurring rules yet.</div>`; return; }
  list.innerHTML=recurring_rules.map(r=>{
    const cat=categories.find(c=>c.id===r.category_id);
    const acc=accounts.find(a=>a.id===r.account_id);
    return `<div class="rec-card">
      <div class="rec-head">
        <div>
          <div class="rec-name">${cat?.emoji||"🔁"} ${r.remarks||"Recurring"}</div>
          <div class="rec-meta">${r.frequency} · ${acc?.name||"?"}</div>
        </div>
        <span class="badge ${r.type==="income"?"badge-settled":"badge-pending"}">${r.type}</span>
      </div>
      <div class="rec-amount ${r.type==="income"?"green":"red"}">${fmt(r.amount)}</div>
      <div class="rec-due">Next due: ${r.next_due}</div>
      <div style="display:flex;gap:var(--space-2)">
        <button class="btn-sm" onclick="bookRecurring('${r.id}')">Book now</button>
        <button class="btn-danger" onclick="deleteRecurring('${r.id}')">Delete</button>
      </div>
    </div>`;
  }).join("");
}

document.getElementById("addRecurringBtn").addEventListener("click",()=>{
  document.getElementById("recurringRemarks").value="";
  document.getElementById("recurringAmount").value="";
  document.getElementById("recurringNextDue").value=today();
  document.getElementById("recurringFrequency").value="monthly";
  populateAccountSelect("recurringAccount");
  populateCategorySelect("recurringCategory","expense");
  let rt="expense";
  document.querySelectorAll("[data-rtype]").forEach(b=>b.classList.toggle("active",b.dataset.rtype==="expense"));
  document.querySelectorAll("[data-rtype]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      document.querySelectorAll("[data-rtype]").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active"); rt=btn.dataset.rtype;
      populateCategorySelect("recurringCategory",rt);
    });
  });
  openModal("recurringModal");
});

document.getElementById("saveRecurringBtn").addEventListener("click",async()=>{
  const remarks=document.getElementById("recurringRemarks").value.trim();
  const amount=parseFloat(document.getElementById("recurringAmount").value);
  const account_id=document.getElementById("recurringAccount").value;
  const category_id=document.getElementById("recurringCategory").value||null;
  const frequency=document.getElementById("recurringFrequency").value;
  const next_due=document.getElementById("recurringNextDue").value;
  const type=document.querySelector("[data-rtype].active")?.dataset.rtype||"expense";
  if(!amount||amount<=0){ toast("Enter amount"); return; }
  if(!account_id){ toast("Select account"); return; }
  if(!next_due){ toast("Set next due date"); return; }
  const{error}=await supabase.from("recurring_rules").insert({
    user_id:USER.id,account_id,category_id,amount,type,frequency,next_due,remarks,is_active:true
  });
  if(error){ toast("❌ "+error.message); return; }
  closeModal("recurringModal"); await loadAll(); renderRecurring(); toast("✅ Rule saved");
});

window.bookRecurring=async function(id){
  const r=recurring_rules.find(x=>x.id===id); if(!r) return;
  await supabase.from("transactions").insert({
    user_id:USER.id,account_id:r.account_id,category_id:r.category_id,
    amount:r.amount,type:r.type,date:today(),remarks:r.remarks||"Recurring",is_transfer:false
  });
  // Advance next_due
  const d=new Date(r.next_due);
  if(r.frequency==="daily")   d.setDate(d.getDate()+1);
  if(r.frequency==="weekly")  d.setDate(d.getDate()+7);
  if(r.frequency==="monthly") d.setMonth(d.getMonth()+1);
  if(r.frequency==="yearly")  d.setFullYear(d.getFullYear()+1);
  await supabase.from("recurring_rules").update({next_due:d.toISOString().split("T")[0]}).eq("id",id);
  await loadAll(); renderRecurring(); renderDashboard(); toast("✅ Booked");
};

window.deleteRecurring=async function(id){
  if(!confirm("Delete this recurring rule?")) return;
  await supabase.from("recurring_rules").delete().eq("id",id);
  await loadAll(); renderRecurring(); toast("🗑️ Deleted");
};

/* ══════════════════════════════════════════════════════════════
   REPORTS
══════════════════════════════════════════════════════════════ */
function renderReports(){
  const cur=profile.currency||"INR";
  const sym=cur==="USD"?"$":cur==="EUR"?"€":cur==="GBP"?"£":"₹";
  const mtx=thisMonthTxns();
  const income =mtx.filter(t=>t.type==="income" &&!t.is_transfer).reduce((s,t)=>s+Number(t.amount),0);
  const expense=mtx.filter(t=>t.type==="expense"&&!t.is_transfer).reduce((s,t)=>s+Number(t.amount),0);
  document.getElementById("repIncome").textContent =fmt(income,sym);
  document.getElementById("repExpense").textContent=fmt(expense,sym);
  document.getElementById("repSavings").textContent=fmt(income-expense,sym);

  // By category
  const expMap={};
  mtx.filter(t=>t.type==="expense"&&!t.is_transfer).forEach(t=>{
    const key=t.category_id||"__none";
    expMap[key]=(expMap[key]||0)+Number(t.amount);
  });
  const total=Object.values(expMap).reduce((s,v)=>s+v,0)||1;
  const sorted=Object.entries(expMap).sort((a,b)=>b[1]-a[1]);
  document.getElementById("reportCatList").innerHTML=sorted.length
    ? sorted.map(([cid,amt])=>{
        const cat=categories.find(c=>c.id===cid);
        const pct=Math.round((amt/total)*100);
        return `<div class="cat-report-row">
          <span>${cat?.emoji||"📂"} ${cat?.name||"Other"}</span>
          <div class="cat-bar-wrap"><div class="cat-bar" style="width:${pct}%;background:${cat?.color||"var(--color-primary)"}"></div></div>
          <span class="cat-amount">${fmt(amt,sym)}</span>
        </div>`;
      }).join("")
    : `<div class="empty-state">No expense data this month.</div>`;
}

document.getElementById("exportCsvBtn").addEventListener("click",()=>{
  const header="Date,Type,Amount,Category,Account,Remarks";
  const rows=transactions.map(t=>{
    const cat=categories.find(c=>c.id===t.category_id);
    const acc=accounts.find(a=>a.id===t.account_id);
    return [t.date,t.type,t.amount,cat?.name||"",acc?.name||"",t.remarks].join(",");
  });
  const csv=[header,...rows].join("\n");
  const a=document.createElement("a");
  a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv);
  a.download=`flowledger_export_${today()}.csv`;
  a.click(); toast("✅ CSV exported");
});

/* ══════════════════════════════════════════════════════════════
   SETTINGS — CATEGORIES
══════════════════════════════════════════════════════════════ */
function renderSettings(){
  renderProfile();
  const list=document.getElementById("categoryList");
  list.innerHTML=categories.length
    ? categories.map(c=>`
        <div class="cat-row">
          <span class="cat-emoji">${c.emoji}</span>
          <span class="cat-name">${c.name}</span>
          <span class="cat-type">${c.type}</span>
          ${!c.is_default?`<button class="btn-danger" onclick="deleteCat('${c.id}')">✕</button>`:""}
        </div>`).join("")
    : `<div class="empty-state">No categories.</div>`;
}

let currentCatType="expense";
document.querySelectorAll("[data-ctype]").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll("[data-ctype]").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active"); currentCatType=btn.dataset.ctype;
  });
});

document.getElementById("addCategoryBtn").addEventListener("click",()=>{
  document.getElementById("catEmoji").value="📂";
  document.getElementById("catName").value="";
  currentCatType="expense";
  document.querySelectorAll("[data-ctype]").forEach(b=>b.classList.toggle("active",b.dataset.ctype==="expense"));
  openModal("categoryModal");
});

document.getElementById("saveCategoryBtn").addEventListener("click",async()=>{
  const emoji=document.getElementById("catEmoji").value.trim()||"📂";
  const name=document.getElementById("catName").value.trim();
  if(!name){ toast("Enter category name"); return; }
  const{error}=await supabase.from("categories").insert({
    user_id:USER.id,name,emoji,type:currentCatType,color:"#01696f",is_default:false
  });
  if(error){ toast("❌ "+error.message); return; }
  closeModal("categoryModal"); await loadAll(); renderSettings(); toast("✅ Category added");
});

window.deleteCat=async function(id){
  if(!confirm("Delete this category?")) return;
  await supabase.from("categories").delete().eq("id",id);
  await loadAll(); renderSettings(); toast("🗑️ Deleted");
};

/* ══════════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════════ */
await loadAll();
renderProfile();
renderRoute();
