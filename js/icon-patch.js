
const ICONS = [
  {g:'accounts',k:'bank',i:'🏦',l:'Bank'}, {g:'accounts',k:'wallet',i:'👛',l:'Wallet'}, {g:'accounts',k:'card',i:'💳',l:'Card'},
  {g:'accounts',k:'cash',i:'💵',l:'Cash'}, {g:'accounts',k:'upi',i:'📱',l:'UPI'}, {g:'accounts',k:'savings',i:'🐷',l:'Savings'},
  {g:'accounts',k:'credit',i:'🪪',l:'Credit'}, {g:'accounts',k:'investment',i:'📈',l:'Invest'}, {g:'accounts',k:'bank2',i:'🏧',l:'ATM'},
  {g:'income',k:'salary',i:'🧾',l:'Salary'}, {g:'income',k:'bonus',i:'🎁',l:'Bonus'}, {g:'income',k:'cashback',i:'💚',l:'Cashback'},
  {g:'income',k:'interest',i:'💹',l:'Interest'}, {g:'income',k:'refund',i:'↩️',l:'Refund'}, {g:'income',k:'gift',i:'🎉',l:'Gift'},
  {g:'income',k:'freelance',i:'💼',l:'Freelance'}, {g:'income',k:'sale',i:'🛒',l:'Sale'}, {g:'income',k:'dividend',i:'🏛️',l:'Dividend'},
  {g:'expense',k:'food',i:'🍔',l:'Food'}, {g:'expense',k:'grocery',i:'🛍️',l:'Grocery'}, {g:'expense',k:'travel',i:'🚆',l:'Travel'},
  {g:'expense',k:'fuel',i:'⛽',l:'Fuel'}, {g:'expense',k:'medical',i:'💊',l:'Medical'}, {g:'expense',k:'education',i:'📚',l:'Education'},
  {g:'expense',k:'shopping',i:'🛍️',l:'Shopping'}, {g:'expense',k:'rent',i:'🏠',l:'Rent'}, {g:'expense',k:'entertainment',i:'🎬',l:'Entertainment'},
  {g:'expense',k:'bill',i:'🧾',l:'Bill'}, {g:'expense',k:'mobile',i:'📶',l:'Mobile'}, {g:'expense',k:'internet',i:'🌐',l:'Internet'},
  {g:'expense',k:'dining',i:'🍽️',l:'Dining'}, {g:'expense',k:'coffee',i:'☕',l:'Coffee'}, {g:'expense',k:'snacks',i:'🍪',l:'Snacks'},
  {g:'expense',k:'gift',i:'🎁',l:'Gift'}, {g:'expense',k:'clothes',i:'👕',l:'Clothes'}, {g:'expense',k:'home',i:'🛏️',l:'Home'},
  {g:'expense',k:'maintenance',i:'🔧',l:'Maintenance'}, {g:'expense',k:'subscription',i:'📺',l:'Subscription'}, {g:'expense',k:'pet',i:'🐶',l:'Pet'},
  {g:'expense',k:'beauty',i:'💅',l:'Beauty'}, {g:'expense',k:'sports',i:'🏏',l:'Sports'}, {g:'expense',k:'health',i:'❤️',l:'Health'},
  {g:'expense',k:'kids',i:'🧸',l:'Kids'}, {g:'expense',k:'donation',i:'🤝',l:'Donation'}, {g:'expense',k:'tax',i:'🧮',l:'Tax'}
];
let iconTargetInput = null;
function openIconPicker(inputId){ iconTargetInput = document.getElementById(inputId); document.getElementById('iconSearch').value=''; renderIconGrid(); openModal('iconPickerModal'); }
function renderIconGrid(){ const q=(document.getElementById('iconSearch').value||'').trim().toLowerCase(); const group=(document.querySelector('#iconTabRow .active')?.dataset.iconGroup)||'all'; const grid=document.getElementById('iconGrid'); const items=ICONS.filter(x => group==='all' || x.g===group).filter(x => !q || x.l.toLowerCase().includes(q) || x.k.toLowerCase().includes(q)); grid.innerHTML = items.map(x => `<button type="button" class="icon-chip" data-icon="${x.i}" data-label="${x.l}"><span class="ico">${x.i}</span><span class="lbl">${x.l}</span></button>`).join(''); grid.querySelectorAll('.icon-chip').forEach(btn=>btn.addEventListener('click',()=>{ if(iconTargetInput) iconTargetInput.value = btn.dataset.icon; closeModal('iconPickerModal'); })); }
window.openIconPicker = openIconPicker;
window.FLOWLEDGER_ICON_GALLERY = ICONS;
function installThemeToggle(){ const saved = localStorage.getItem('flowledger-theme') || 'light'; document.documentElement.setAttribute('data-theme', saved); const btn = document.getElementById('themeBtn'); if(btn){ btn.classList.add('theme-swap'); btn.addEventListener('click',()=>{ const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', next); localStorage.setItem('flowledger-theme', next); }); } }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installThemeToggle); else installThemeToggle();
