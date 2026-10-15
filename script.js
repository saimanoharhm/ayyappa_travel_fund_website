import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// 1. Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAjybKLqCK7qBBFA0t0YxdnSMLG4A7faRc",
  authDomain: "ayyappa-travel-fund-web.firebaseapp.com",
  projectId: "ayyappa-travel-fund-web",
  storageBucket: "ayyappa-travel-fund-web.firebasestorage.app",
  messagingSenderId: "850754876506",
  appId: "1:850754876506:web:a6475d6e60f2b93f129463",
};

// 2. Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

const TARGET_AMOUNT = 15000;

// 3. HTML elements
const signInButton = document.getElementById("signInButton");
const signOutButton = document.getElementById("signOutButton");
const authStatus = document.getElementById("authStatus");
const signedInUser = document.getElementById("signedInUser");
const appContent = document.getElementById("appContent");

const form = document.getElementById("depositForm");
const amountInput = document.getElementById("depositAmount");
const dateInput = document.getElementById("depositDate");
const noteInput = document.getElementById("depositNote");
const formMessage = document.getElementById("formMessage");
const addDepositButton = document.getElementById("addDepositButton");

const historyBody = document.getElementById("historyBody");
const historyTableWrap = document.getElementById("historyTableWrap");
const emptyState = document.getElementById("emptyState");

// 4. Currency formatter
const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

let deposits = [];
let stopListeningToDeposits = null;
let authReady = false;

// 5. Today's local date
function todayLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// 6. Format a date
function formatDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

// 7. Show form messages
function showMessage(message, isError = false) {
  formMessage.textContent = message;
  formMessage.classList.toggle("error", isError);
}

function updateCountdown() {
  // Deadline: 4 November 2026, 11:59:59 PM IST

  const deadline = new Date("2026-11-04T00:00:00+05:30");

  const now = new Date();
  const remaining = deadline.getTime() - now.getTime();

  const countdownElement = document.getElementById("countdown");

  if (!countdownElement) return;

  if (remaining <= 0) {
    countdownElement.textContent = "⏰ Fundraising deadline has passed!";
    return;
  }

  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((remaining / (1000 * 60)) % 60);
  const seconds = Math.floor((remaining / 1000) % 60);

  countdownElement.textContent = `${days} days : ${hours} hours : ${minutes} minutes : ${seconds} seconds`;
}

updateCountdown();
setInterval(updateCountdown, 1000);

// 8. Render savings summary
function renderSummary() {
  const total = deposits.reduce((sum, item) => sum + item.amount, 0);

  const remaining = Math.max(TARGET_AMOUNT - total, 0);
  const percentage = Math.min((total / TARGET_AMOUNT) * 100, 100);

  const depositDates = new Set(deposits.map((item) => item.date));

  document.getElementById("targetAmount").textContent =
    money.format(TARGET_AMOUNT);

  document.getElementById("totalDeposited").textContent = money.format(total);

  document.getElementById("amountRemaining").textContent =
    money.format(remaining);

  document.getElementById("depositDays").textContent = String(
    depositDates.size,
  );

  document.getElementById("progressText").textContent =
    `${Math.floor(percentage)}% completed`;

  document.getElementById("remainingText").textContent =
    remaining === 0
      ? "Target reached!"
      : `${money.format(remaining)} remaining`;

  document.getElementById("progressFill").style.width = `${percentage}%`;

  document
    .getElementById("progressTrack")
    .setAttribute("aria-valuenow", String(Math.min(total, TARGET_AMOUNT)));

  const goalNote = document.getElementById("goalNote");

  if (total >= TARGET_AMOUNT) {
    const extra = total - TARGET_AMOUNT;

    goalNote.textContent =
      extra > 0
        ? `Target reached! You have ${money.format(extra)} extra.`
        : "Target reached! Your Ayyappa travel fund is ready.";
  } else if (total > 0) {
    goalNote.textContent = `Great progress — ${money.format(remaining)} left to reach your goal.`;
  } else {
    goalNote.textContent = "Start by recording your first deposit.";
  }
}

// 9. Render deposit history
function renderHistory() {
  historyBody.replaceChildren();

  const sorted = [...deposits].sort(
    (a, b) =>
      b.date.localeCompare(a.date) ||
      (b.createdAtMillis || 0) - (a.createdAtMillis || 0),
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

    deleteButton.setAttribute(
      "aria-label",
      `Delete deposit of ${money.format(deposit.amount)} on ${formatDate(deposit.date)}`,
    );

    deleteButton.addEventListener("click", () => {
      deleteDeposit(deposit.id);
    });

    actionCell.appendChild(deleteButton);
    row.append(dateCell, noteCell, amountCell, actionCell);
    historyBody.appendChild(row);
  }
}

// 10. Render the entire dashboard
function render() {
  renderSummary();
  renderHistory();
}

// 11. Listen for shared Firestore deposits
function listenToSharedDeposits() {
  if (stopListeningToDeposits) {
    stopListeningToDeposits();
  }

  authStatus.textContent = "Loading shared deposits…";

  const depositsQuery = query(
    collection(db, "deposits"),
    orderBy("date", "desc"),
  );

  stopListeningToDeposits = onSnapshot(
    depositsQuery,
    (snapshot) => {
      deposits = snapshot.docs.map((item) => {
        const data = item.data();

        return {
          id: item.id,
          amount: data.amount,
          date: data.date,
          note: data.note || "",
          createdAtMillis: data.createdAt?.toMillis?.() || 0,
        };
      });

      render();

      authStatus.textContent = "Connected. Shared deposits are up to date.";
    },
    (error) => {
      console.error("Firestore listener error:", error);

      authStatus.textContent =
        error.code === "permission-denied"
          ? "Access denied. Check your Firestore security rules and approved Google emails."
          : "Could not load shared deposits. Check your connection and Firebase configuration.";
    },
  );
}

// 12. Delete a deposit
async function deleteDeposit(id) {
  if (!auth.currentUser) {
    showMessage("Please sign in first.", true);
    return;
  }

  const deposit = deposits.find((item) => item.id === id);

  if (!deposit) return;

  const confirmed = window.confirm(
    `Delete the shared deposit of ${money.format(deposit.amount)}? This affects both users.`,
  );

  if (!confirmed) return;

  try {
    await deleteDoc(doc(db, "deposits", id));
    showMessage("Deposit deleted from the shared fund.");
  } catch (error) {
    console.error("Delete failed:", error);

    showMessage(
      "Could not delete this deposit. Check your access and Firestore rules.",
      true,
    );
  }
}

// 13. Google sign-in using a popup
signInButton.addEventListener("click", async () => {
  if (!authReady) {
    authStatus.textContent = "Please wait while Firebase initializes.";
    return;
  }

  signInButton.disabled = true;
  authStatus.textContent = "Opening Google sign-in…";

  try {
    await signInWithPopup(auth, googleProvider);

    // onAuthStateChanged handles showing the dashboard.
    authStatus.textContent = "Google sign-in successful.";
  } catch (error) {
    console.error("Google sign-in failed:", error.code, error.message);

    const messages = {
      "auth/popup-closed-by-user":
        "The sign-in window was closed before sign-in finished.",
      "auth/unauthorized-domain":
        "This website domain is not authorized in Firebase Authentication.",
      "auth/popup-blocked":
        "Your browser blocked the sign-in popup. Allow popups and try again.",
      "auth/operation-not-allowed":
        "Google sign-in is not enabled in Firebase Authentication.",
      "auth/network-request-failed":
        "Network error. Check your internet connection and try again.",
      "auth/unauthorized-continue-uri":
        "The sign-in return URL is not authorized in Firebase.",
    };

    authStatus.textContent =
      messages[error.code] || `Sign-in failed: ${error.code || error.message}`;

    signInButton.disabled = false;
  }
});

// 14. Sign out
signOutButton.addEventListener("click", async () => {
  signOutButton.disabled = true;

  try {
    await signOut(auth);
    showMessage("");
    authStatus.textContent = "You have signed out.";
  } catch (error) {
    console.error("Sign-out failed:", error);

    authStatus.textContent = `Could not sign out: ${error.message}`;
  } finally {
    signOutButton.disabled = false;
  }
});

// 15. Add a deposit
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showMessage("");

  const user = auth.currentUser;
  const amount = Number(amountInput.value);
  const date = dateInput.value;
  const note = noteInput.value.trim();

  if (!user) {
    showMessage("Please sign in before adding a deposit.", true);
    return;
  }

  if (!Number.isInteger(amount) || amount < 1 || amount > 1000000) {
    showMessage("Enter a whole amount between ₹1 and ₹10,00,000.", true);

    amountInput.focus();
    return;
  }

  if (!date) {
    showMessage("Please choose the deposit date.", true);
    dateInput.focus();
    return;
  }

  if (date > todayLocalDate()) {
    showMessage("The deposit date cannot be in the future.", true);
    dateInput.focus();
    return;
  }

  addDepositButton.disabled = true;

  try {
    await addDoc(collection(db, "deposits"), {
      amount,
      date,
      note,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
    });

    form.reset();
    dateInput.value = todayLocalDate();

    showMessage("Deposit added to the shared fund.");
    amountInput.focus();
  } catch (error) {
    console.error("Add deposit failed:", error);

    showMessage(
      error.code === "permission-denied"
        ? "Access denied. Check your Firestore security rules and approved Google emails."
        : "Could not save the deposit. Check your connection and Firebase configuration.",
      true,
    );
  } finally {
    addDepositButton.disabled = false;
  }
});

// 16. Monitor authentication state
onAuthStateChanged(
  auth,
  (user) => {
    authReady = true;

    if (stopListeningToDeposits) {
      stopListeningToDeposits();
      stopListeningToDeposits = null;
    }

    deposits = [];
    render();

    if (user) {
      signInButton.hidden = true;
      signInButton.disabled = false;

      signOutButton.hidden = false;
      appContent.hidden = false;
      signedInUser.hidden = false;

      signedInUser.textContent = `Signed in as ${user.email || user.displayName || "Google user"}`;

      showMessage("");
      listenToSharedDeposits();
    } else {
      signInButton.hidden = false;
      signInButton.disabled = false;

      signOutButton.hidden = true;
      appContent.hidden = true;
      signedInUser.hidden = true;
      signedInUser.textContent = "";

      authStatus.textContent =
        "Sign in with an approved Google account to continue.";
    }
  },
  (error) => {
    console.error("Authentication state error:", error);

    authReady = true;
    signInButton.hidden = false;
    signInButton.disabled = false;

    appContent.hidden = true;

    authStatus.textContent = `Could not initialize authentication: ${error.message}`;
  },
);

// 17. Set the default deposit date
dateInput.value = todayLocalDate();
