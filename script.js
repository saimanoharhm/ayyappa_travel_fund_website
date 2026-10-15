const TARGET_AMOUNT = 15000;
const STORAGE_KEY = "ayyappaTravelFundDeposits";

const form = document.getElementById("depositForm");
const amountInput = document.getElementById("depositAmount");
const dateInput = document.getElementById("depositDate");
const noteInput = document.getElementById("depositNote");
const formMessage = document.getElementById("formMessage");
const historyBody = document.getElementById("historyBody");
const historyTableWrap = document.getElementById("historyTableWrap");
const emptyState = document.getElementById("emptyState");

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

let deposits = loadDeposits();

function todayLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function loadDeposits() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(saved)) return [];
    return saved.filter((item) =>
      item &&
      typeof item.id === "string" &&
      Number.isFinite(item.amount) &&
      item.amount > 0 &&
      typeof item.date === "string"
    );
  } catch (error) {
    return [];
  }
}

function saveDeposits() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deposits));
    return true;
  } catch (error) {
    formMessage.textContent = "Could not save in this browser. Check your browser storage settings.";
    return false;
  }
}

function formatDate(dateString) {
  // Add a time to avoid shifting the displayed date across time zones.
  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}

function renderSummary() {
  const total = deposits.reduce((sum, item) => sum + item.amount, 0);
  const remaining = Math.max(TARGET_AMOUNT - total, 0);
  const percentage = Math.min((total / TARGET_AMOUNT) * 100, 100);
  const depositDates = new Set(deposits.map((item) => item.date));

  document.getElementById("targetAmount").textContent = money.format(TARGET_AMOUNT);
  document.getElementById("totalDeposited").textContent = money.format(total);
  document.getElementById("amountRemaining").textContent = money.format(remaining);
  document.getElementById("depositDays").textContent = String(depositDates.size);
  document.getElementById("progressText").textContent = `${Math.floor(percentage)}% completed`;
  document.getElementById("remainingText").textContent =
    remaining === 0 ? "Target reached!" : `${money.format(remaining)} remaining`;

  const progressFill = document.getElementById("progressFill");
  progressFill.style.width = `${percentage}%`;

  const progressTrack = document.getElementById("progressTrack");
  progressTrack.setAttribute("aria-valuemax", String(TARGET_AMOUNT));
  progressTrack.setAttribute("aria-valuenow", String(Math.min(total, TARGET_AMOUNT)));

  const goalNote = document.getElementById("goalNote");
  if (total >= TARGET_AMOUNT) {
    const extra = total - TARGET_AMOUNT;
    goalNote.textContent = extra > 0
      ? `Target reached! You have ${money.format(extra)} extra.`
      : "Target reached! Your Ayyappa travel fund is ready.";
  } else if (total > 0) {
    goalNote.textContent = `Great progress — ${money.format(remaining)} left to reach your goal.`;
  } else {
    goalNote.textContent = "Start by recording your first deposit.";
  }
}

function renderHistory() {
  historyBody.replaceChildren();
  const sorted = [...deposits].sort((a, b) =>
    b.date.localeCompare(a.date) || b.id.localeCompare(a.id)
  );

  emptyState.hidden = sorted.length > 0;
  historyTableWrap.hidden = sorted.length === 0;

  for (const deposit of sorted) {
    const row = document.createElement("tr");

    const dateCell = document.createElement("td");
    dateCell.textContent = formatDate(deposit.date);

    const noteCell = document.createElement("td");
    noteCell.textContent = deposit.note || "—";

    const amountCell = document.createElement("td");
    amountCell.className = "amount-cell";
    amountCell.textContent = money.format(deposit.amount);

    const actionCell = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute("aria-label", `Delete deposit of ${money.format(deposit.amount)} on ${formatDate(deposit.date)}`);
    deleteButton.addEventListener("click", () => deleteDeposit(deposit.id));
    actionCell.appendChild(deleteButton);

    row.append(dateCell, noteCell, amountCell, actionCell);
    historyBody.appendChild(row);
  }
}

function render() {
  renderSummary();
  renderHistory();
}

function deleteDeposit(id) {
  const deposit = deposits.find((item) => item.id === id);
  if (!deposit) return;

  const confirmed = window.confirm(`Delete the deposit of ${money.format(deposit.amount)}?`);
  if (!confirmed) return;

  deposits = deposits.filter((item) => item.id !== id);
  saveDeposits();
  formMessage.textContent = "Deposit deleted.";
  render();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  formMessage.textContent = "";

  const amount = Number(amountInput.value);
  const date = dateInput.value;
  const note = noteInput.value.trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    formMessage.textContent = "Please enter a deposit amount greater than ₹0.";
    amountInput.focus();
    return;
  }

  if (!Number.isInteger(amount)) {
    formMessage.textContent = "Please enter a whole amount in rupees.";
    amountInput.focus();
    return;
  }

  if (!date) {
    formMessage.textContent = "Please choose the deposit date.";
    dateInput.focus();
    return;
  }

  deposits.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    amount,
    date,
    note
  });

  if (!saveDeposits()) {
    deposits.pop();
    return;
  }

  form.reset();
  dateInput.value = todayLocalDate();
  formMessage.textContent = "Deposit added successfully.";
  render();
  amountInput.focus();
});

document.getElementById("clearHistory").addEventListener("click", () => {
  if (deposits.length === 0) return;

  const confirmed = window.confirm("Clear all deposit records? This cannot be undone.");
  if (!confirmed) return;

  deposits = [];
  saveDeposits();
  formMessage.textContent = "All deposit records cleared.";
  render();
});

dateInput.value = todayLocalDate();
render();
