
// TODO [Basic] Buat variabel array untuk menyimpan semua data transaksi, contoh: let transactions = []
let transactions = [];
let editingTransactionId = null;
let currentSearchKeyword = '';

const STORAGE_KEY = 'EXPENSE_TRACKER_APPS';
const RENDER_EVENT = 'transaction:updated';

// TODO [Basic] Buat fungsi untuk menghasilkan ID unik secara otomatis, contoh: gunakan +new Date()
function generateId() {
  return +new Date();
}

function isStorageExist() {
  if (typeof (Storage) === 'undefined') {
    alert('Browser kamu tidak mendukung local storage!');
    return false;
  }
  return true;
}

function saveData() {
  if (isStorageExist()) {
    const parsed = JSON.stringify(transactions);
    localStorage.setItem(STORAGE_KEY, parsed);
  }
}

function loadDataFromStorage() {
  const serializedData = localStorage.getItem(STORAGE_KEY);
  if (serializedData !== null) {
    const data = JSON.parse(serializedData);
    if (Array.isArray(data)) {
      transactions = data;
    }
  }
}

function dispatchUpdateEvent() {
  document.dispatchEvent(new Event(RENDER_EVENT));
}

// TODO [Basic] Ambil elemen kontainer incomeList dan expenseList dari DOM
const incomeListContainer = document.getElementById('incomeList');
const expenseListContainer = document.getElementById('expenseList');

// Elemen Form & Input
const transactionForm = document.getElementById('transactionForm');
const titleInput = document.getElementById('transactionFormTitleInput');
const amountInput = document.getElementById('transactionFormAmountInput');
const dateInput = document.getElementById('transactionFormDateInput');
const typeSelect = document.getElementById('transactionFormTypeSelect');
const submitButton = document.querySelector('[data-testid="transactionFormSubmitButton"]') || transactionForm?.querySelector('button[type="submit"]');

// Elemen Dasbor
const balanceAmountEl = document.querySelector('.tracker-summary__balance-amount');
const incomeAmountEl = document.querySelector('.tracker-summary__stat-amount--income');
const expenseAmountEl = document.querySelector('.tracker-summary__stat-amount--expense');

// Elemen Pencarian
const searchForm = document.getElementById('searchTransactionForm');
const searchInput = document.getElementById('searchTransactionFormTitleInput');

function updateDashboard() {
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalBalance = totalIncome - totalExpense;

  if (balanceAmountEl) {
    balanceAmountEl.textContent = `Rp ${totalBalance.toLocaleString('id-ID')}`;
  }
  if (incomeAmountEl) {
    incomeAmountEl.textContent = `Rp ${totalIncome.toLocaleString('id-ID')}`;
  }
  if (expenseAmountEl) {
    expenseAmountEl.textContent = `Rp ${totalExpense.toLocaleString('id-ID')}`;
  }
}

function createTransactionCard(transaction) {
  // Kontainer Kartu Transaksi
  const card = document.createElement('div');
  card.classList.add('tracker-transaction-item');
  card.setAttribute('data-testid', 'transactionItem');

  // Ikon Transaksi
  const iconDiv = document.createElement('div');
  iconDiv.classList.add(
    'tracker-transaction-item__icon',
    transaction.type === 'income'
      ? 'tracker-transaction-item__icon--income'
      : 'tracker-transaction-item__icon--expense'
  );
  iconDiv.textContent = transaction.type === 'income' ? '💰' : '💸';

  // Detail Transaksi (Judul, Tanggal, Tipe)
  const detailDiv = document.createElement('div');
  detailDiv.classList.add('tracker-transaction-item__detail');

  const titleEl = document.createElement('h3');
  titleEl.classList.add('tracker-transaction-item__title');
  titleEl.setAttribute('data-testid', 'transactionItemTitle');
  titleEl.textContent = transaction.title;

  const dateEl = document.createElement('p');
  dateEl.classList.add('tracker-transaction-item__date');
  dateEl.setAttribute('data-testid', 'transactionItemDate');
  dateEl.textContent = `Tanggal: ${transaction.date}`;

  const typeEl = document.createElement('p');
  typeEl.classList.add('visually-hidden');
  typeEl.setAttribute('data-testid', 'transactionItemType');
  typeEl.textContent = `Tipe: ${transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}`;

  detailDiv.append(titleEl, dateEl, typeEl);

  // Bagian Kanan (Nominal & Akses Tombol)
  const rightDiv = document.createElement('div');
  rightDiv.classList.add('tracker-transaction-item__right');

  const amountEl = document.createElement('p');
  amountEl.classList.add(
    'tracker-transaction-item__amount',
    transaction.type === 'income'
      ? 'tracker-transaction-item__amount--income'
      : 'tracker-transaction-item__amount--expense'
  );
  amountEl.setAttribute('data-testid', 'transactionItemAmount');
  amountEl.textContent = `Nominal: Rp${transaction.amount}`;

  const actionsDiv = document.createElement('div');
  actionsDiv.classList.add('tracker-transaction-item__actions');

  // TODO [Basic] Tombol Ubah Tipe
  const editTypeBtn = document.createElement('button');
  editTypeBtn.classList.add('tracker-transaction-item__btn');
  editTypeBtn.setAttribute('data-testid', 'transactionItemEditTypeButton');
  editTypeBtn.textContent = 'Ubah Tipe';
  editTypeBtn.addEventListener('click', () => {
    toggleTransactionType(transaction.id);
  });

  // TODO [Skilled] Tombol Edit
  const editBtn = document.createElement('button');
  editBtn.classList.add('tracker-transaction-item__btn');
  editBtn.setAttribute('data-testid', 'transactionItemEditButton');
  editBtn.textContent = 'Edit';
  editBtn.addEventListener('click', () => {
    startEditTransaction(transaction.id);
  });

  // TODO [Basic] Tombol Hapus
  const deleteBtn = document.createElement('button');
  deleteBtn.classList.add('tracker-transaction-item__btn');
  deleteBtn.setAttribute('data-testid', 'transactionItemDeleteButton');
  deleteBtn.textContent = 'Hapus';
  deleteBtn.addEventListener('click', () => {
    deleteTransaction(transaction.id);
  });

  actionsDiv.append(editTypeBtn, editBtn, deleteBtn);
  rightDiv.append(amountEl, actionsDiv);

  card.append(iconDiv, detailDiv, rightDiv);
  return card;
}

function renderTransactions(filterKeyword = '') {
  if (!incomeListContainer || !expenseListContainer) return;

  incomeListContainer.innerHTML = '';
  expenseListContainer.innerHTML = '';

  const keyword = filterKeyword.toLowerCase().trim();
  const filteredTransactions = transactions.filter((t) =>
    t.title.toLowerCase().includes(keyword)
  );

  let incomeCount = 0;
  let expenseCount = 0;

  for (const item of filteredTransactions) {
    const card = createTransactionCard(item);
    if (item.type === 'income') {
      incomeListContainer.appendChild(card);
      incomeCount++;
    } else {
      expenseListContainer.appendChild(card);
      expenseCount++;
    }
  }

  if (incomeCount === 0) {
    const emptyEl = document.createElement('div');
    emptyEl.classList.add('tracker-empty-state');
    emptyEl.textContent = 'Belum ada catatan arus pemasukan';
    incomeListContainer.appendChild(emptyEl);
  }

  if (expenseCount === 0) {
    const emptyEl = document.createElement('div');
    emptyEl.classList.add('tracker-empty-state');
    emptyEl.textContent = 'Belum ada catatan arus pengeluaran';
    expenseListContainer.appendChild(emptyEl);
  }
}

function toggleTransactionType(id) {
  const item = transactions.find((t) => t.id === id);
  if (item) {
    item.type = item.type === 'income' ? 'expense' : 'income';
    dispatchUpdateEvent();
  }
}

function deleteTransaction(id) {
  transactions = transactions.filter((t) => t.id !== id);
  if (editingTransactionId === id) {
    editingTransactionId = null;
    if (transactionForm) transactionForm.reset();
    if (submitButton) submitButton.textContent = 'Simpan';
  }
  dispatchUpdateEvent();
}

function startEditTransaction(id) {
  const item = transactions.find((t) => t.id === id);
  if (!item) return;

  titleInput.value = item.title;
  amountInput.value = item.amount;
  dateInput.value = item.date;
  typeSelect.value = item.type;

  editingTransactionId = id;
  if (submitButton) submitButton.textContent = 'Perbarui';

  transactionForm.scrollIntoView({ behavior: 'smooth' });
  titleInput.focus();
}

// TODO [Basic] Tambahkan event listener 'submit' pada form, panggil e.preventDefault() di dalamnya
if (transactionForm) {
  transactionForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = titleInput.value.trim();
    const amount = Number(amountInput.value);
    const date = dateInput.value;
    const type = typeSelect.value;

    if (!title) {
      alert('Judul transaksi tidak boleh kosong!');
      return;
    }

    if (isNaN(amount) || amount < 1) {
      alert('Nominal transaksi harus 1 Rupiah atau lebih!');
      return;
    }

    if (editingTransactionId !== null) {
      // Modus Edit
      const itemIndex = transactions.findIndex((t) => t.id === editingTransactionId);
      if (itemIndex !== -1) {
        transactions[itemIndex] = {
          ...transactions[itemIndex],
          title,
          amount,
          date: date || transactions[itemIndex].date,
          type,
        };
      }
      editingTransactionId = null;
      if (submitButton) submitButton.textContent = 'Simpan';
    } else {
      // Modus Tambah Baru
      // TODO [Basic] Di dalam handler submit, ambil nilai input lalu tambahkan sebagai objek transaksi baru ke array
      const newTransaction = {
        id: generateId(),
        title,
        amount,
        date: date || new Date().toISOString().split('T')[0],
        type,
      };
      transactions.push(newTransaction);
    }

    transactionForm.reset();
    // Atur tanggal ke hari ini secara default
    if (dateInput) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }

    dispatchUpdateEvent();
  });
}

if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    currentSearchKeyword = e.target.value;
    renderTransactions(currentSearchKeyword);
  });
}

if (searchForm) {
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    currentSearchKeyword = searchInput.value;
    renderTransactions(currentSearchKeyword);
  });
}

document.addEventListener(RENDER_EVENT, () => {
  saveData();
  renderTransactions(currentSearchKeyword);
  updateDashboard();
});

// Inisialisasi Saat Aplikasi Dimuat Pertama Kali
document.addEventListener('DOMContentLoaded', () => {
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  if (isStorageExist()) {
    loadDataFromStorage();
  }

  dispatchUpdateEvent();
});