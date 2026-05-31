const ICON_BASE = "./assets/icons/";
const ICONS = [
  { g: "accounts", k: "bank", f: "bank.png", l: "Bank" },
  { g: "accounts", k: "wallet", f: "wallet.png", l: "Wallet" },
  { g: "accounts", k: "wallet", f: "wallet_1.png", l: "Wallet" },
  { g: "accounts", k: "card", f: "card.png", l: "Card" },
  { g: "accounts", k: "cash", f: "cash.png", l: "Cash" },
  { g: "accounts", k: "cash", f: "cash_1.png", l: "Cash" },
  { g: "accounts", k: "cash", f: "cash_3.png", l: "Cash" },
  { g: "accounts", k: "cash", f: "coins.png", l: "Cash" },
  { g: "accounts", k: "Stocks", f: "Stocks.png", l: "Stocks" },
  { g: "accounts", k: "gold", f: "gold.png", l: "Gold" },
  { g: "accounts", k: "safe", f: "safe.png", l: "Safe" },
  { g: "income", k: "salary", f: "salary.png", l: "Salary" },
  { g: "income", k: "bonus", f: "bonus.png", l: "Bonus" },
  { g: "income", k: "cashback", f: "cashback.png", l: "Cashback" },
  { g: "income", k: "interest", f: "interest.png", l: "Interest" },
  { g: "income", k: "refund", f: "refund.png", l: "Refund" },
  { g: "income", k: "gift", f: "gift.png", l: "Gift" },
  { g: "income", k: "freelance", f: "freelance.png", l: "Freelance" },
  { g: "income", k: "dividend", f: "dividend.png", l: "Dividend" },
  { g: "income", k: "reward", f: "reward.png", l: "Reward" },
  { g: "income", k: "deposit", f: "deposit.png", l: "Deposit" },
  { g: "income", k: "profit", f: "profit.png", l: "Profit" },
  { g: "income", k: "other income", f: "other_income.png", l: "Other income" },
  { g: "expense", k: "food", f: "food.png", l: "Food" },
  { g: "expense", k: "grocery", f: "grocery.png", l: "Grocery" },
  { g: "expense", k: "fruits", f: "fruits.png", l: "Fruits" },
  { g: "expense", k: "vegetable", f: "vegetable", l: "Vegetable" },
  { g: "expense", k: "dessert", f: "dessert", l: "Dessert" },
  { g: "expense", k: "snacks", f: "snacks.png", l: "Snacks" },
  { g: "expense", k: "auto", f: "auto.png", l: "Auto" },
  { g: "expense", k: "taxi", f: "taxi.png", l: "Taxi" },
  { g: "expense", k: "train", f: "train.png", l: "Train" },
  { g: "expense", k: "flight", f: "flight.png", l: "Flight" },
  { g: "expense", k: "fuel", f: "fuel.png", l: "Fuel" },
  { g: "expense", k: "medical", f: "medical.png", l: "Medical" },
  { g: "expense", k: "medicine", f: "medicine.png", l: "Medicine" },
  { g: "expense", k: "stationery", f: "stationery.png", l: "stationery" },
  { g: "expense", k: "shopping", f: "shopping.png", l: "Shopping" },
  { g: "expense", k: "clothes", f: "clothes.png", l: "Clothes" },
  { g: "expense", k: "rent", f: "rent.png", l: "Rent" },
  { g: "expense", k: "movie", f: "movie.png", l: "Movie" },
  { g: "expense", k: "party", f: "party.png", l: "party" },
  { g: "expense", k: "bill", f: "bill.png", l: "Bill" },
  { g: "expense", k: "recharge", f: "recharge.png", l: "Recharge" },
  { g: "expense", k: "cloud", f: "Cloud.png", l: "Cloud" },
  { g: "expense", k: "internet", f: "internet.png", l: "Internet" },
  { g: "expense", k: "ott", f: "ott.png", l: "OTT" },
  { g: "expense", k: "music", f: "music.png", l: "Music" },
  { g: "expense", k: "gaming", f: "gaming.png", l: "Gaming" },
  { g: "expense", k: "subscription", f: "subscription.png", l: "Subscription" },
  { g: "expense", k: "home", f: "home.png", l: "Home" },
  { g: "expense", k: "cleaning", f: "cleaning.png", l: "Cleaning" },
  { g: "expense", k: "repair", f: "repair.png", l: "Repair" },
  { g: "expense", k: "withdraw", f: "withdraw.png", l: "Withdraw" },
  { g: "expense", k: "tax", f: "tax.png", l: "Tax" },
  { g: "expense", k: "gym", f: "gym.png", l: "Gym" },
  { g: "expense", k: "Misc", f: "misc.png", l: "Misc" },
];
function iconPath(file) {
  return ICON_BASE + file;
}
function iconImg(file, label) {
  return `<img class="ico" src="${iconPath(file)}" alt="${label}">`;
}
function iconPreviewHTML(item) {
  return item?.file ? iconImg(item.file, item.label) : item?.emoji || "📂";
}
function renderIconGrid() {
  const q = ($("iconSearch")?.value || "").trim().toLowerCase();
  const g =
    document.querySelector("#iconTabRow .active")?.dataset.iconGroup || "all";
  const items = ICONS.filter((x) => g === "all" || x.g === g).filter(
    (x) => !q || x.l.toLowerCase().includes(q) || x.k.toLowerCase().includes(q),
  );
  $("iconGrid").innerHTML = items
    .map(
      (x) =>
        `<button type="button" class="icon-chip" data-file="${x.f}" data-label="${x.l}">${iconImg(x.f, x.l)}<span class="lbl">${x.l}</span></button>`,
    )
    .join("");
  $("iconGrid")
    .querySelectorAll(".icon-chip")
    .forEach(
      (b) =>
        (b.onclick = () => {
          if (iconTargetInput) iconTargetInput.value = b.dataset.file;
          closeModal("iconPickerModal");
        }),
    );
}
window.openIconPicker = function (id) {
  iconTargetInput = $(id);
  $("iconSearch").value = "";
  document.querySelector("#iconTabRow .active")?.classList.remove("active");
  document.querySelector('[data-icon-group="all"]')?.classList.add("active");
  renderIconGrid();
  openModal("iconPickerModal");
};
