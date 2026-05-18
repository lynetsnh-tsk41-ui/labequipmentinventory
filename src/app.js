// --- STATE MANAGEMENT ---
class State {
  constructor() {
    this.equipment = [];
    this.logs = [];
    this.listeners = [];
    this.load();
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify() {
    this.save();
    this.listeners.forEach(l => l(this));
  }

  load() {
    const data = localStorage.getItem('labInventory');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        this.equipment = parsed.equipment || [];
        this.logs = parsed.logs || [];
      } catch(e) {
        this.equipment = [];
        this.logs = [];
      }
    }
  }

  save() {
    localStorage.setItem('labInventory', JSON.stringify({
      equipment: this.equipment,
      logs: this.logs
    }));
  }

  async resetDemo() {
    try {
      const res = await fetch('./data/demo.json');
      const data = await res.json();
      this.equipment = data.equipment;
      this.logs = data.logs;
      this.notify();
    } catch(e) {
      console.error("Failed to load demo data", e);
      alert("Не вдалося завантажити демо-дані. Переконайтеся, що ви запускаєте файл через веб-сервер, або що браузер дозволяє fetch для file://");
    }
  }

  addEquipment(data) {
    const newEq = {
      id: crypto.randomUUID(),
      name: data.name,
      inventoryNumber: data.inventoryNumber,
      category: data.category,
      description: data.description || '',
      status: 'Available',
      currentAssignee: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.equipment.push(newEq);
    this.addLog(newEq.id, newEq.name, 'Створення', 'Додано до системи');
    this.notify();
  }

  updateEquipment(id, data) {
    const eq = this.equipment.find(e => e.id === id);
    if (!eq) return;
    
    eq.name = data.name;
    eq.inventoryNumber = data.inventoryNumber;
    eq.category = data.category;
    eq.description = data.description || '';
    eq.updatedAt = new Date().toISOString();
    
    this.addLog(eq.id, eq.name, 'Редагування', 'Оновлено дані картки');
    this.notify();
  }

  deleteEquipment(id) {
    const eq = this.equipment.find(e => e.id === id);
    if (!eq) return;
    this.equipment = this.equipment.filter(e => e.id !== id);
    this.addLog(id, eq.name, 'Списання', 'Видалено з бази даних');
    this.notify();
  }

  issueEquipment(id, assignee, comment) {
    const eq = this.equipment.find(e => e.id === id);
    if (!eq) return;
    eq.status = 'Issued';
    eq.currentAssignee = assignee;
    eq.updatedAt = new Date().toISOString();
    
    const details = `Видано користувачу: ${assignee}${comment ? '. Коментар: ' + comment : ''}`;
    this.addLog(eq.id, eq.name, 'Видача', details);
    this.notify();
  }

  returnEquipment(id, returnType, comment) {
    const eq = this.equipment.find(e => e.id === id);
    if (!eq) return;
    
    const oldAssignee = eq.currentAssignee || 'Невідомо';
    eq.status = returnType;
    eq.currentAssignee = '';
    eq.updatedAt = new Date().toISOString();
    
    let actionType = 'Повернення';
    let details = `Повернуто від: ${oldAssignee}`;
    
    if (returnType === 'Maintenance') {
      actionType = 'Обслуговування';
      details = `Відправлено на обслуговування після повернення від: ${oldAssignee}`;
    }
    
    if (comment) details += `. Коментар: ${comment}`;
    
    this.addLog(eq.id, eq.name, actionType, details);
    this.notify();
  }

  sendToMaintenance(id, comment) {
    const eq = this.equipment.find(e => e.id === id);
    if (!eq) return;
    
    eq.status = 'Maintenance';
    eq.updatedAt = new Date().toISOString();
    
    this.addLog(eq.id, eq.name, 'Обслуговування', `Відправлено зі складу${comment ? '. Коментар: '+comment : ''}`);
    this.notify();
  }

  returnFromMaintenance(id, comment) {
    const eq = this.equipment.find(e => e.id === id);
    if (!eq) return;
    
    eq.status = 'Available';
    eq.updatedAt = new Date().toISOString();
    
    this.addLog(eq.id, eq.name, 'Повернення', `Повернуто з обслуговування на склад${comment ? '. Коментар: '+comment : ''}`);
    this.notify();
  }

  addLog(eqId, eqName, actionType, details) {
    this.logs.unshift({
      id: crypto.randomUUID(),
      equipmentId: eqId,
      equipmentName: eqName,
      actionType,
      details,
      timestamp: new Date().toISOString()
    });
  }

  isInventoryNumberUnique(num, ignoreId = null) {
    return !this.equipment.some(e => e.inventoryNumber.toLowerCase() === num.toLowerCase() && e.id !== ignoreId);
  }
}

// --- UI RENDERING ---
function renderStats(state) {
  const container = document.getElementById('stats-panel');
  const total = state.equipment.length;
  const available = state.equipment.filter(e => e.status === 'Available').length;
  const issued = state.equipment.filter(e => e.status === 'Issued').length;
  const maintenance = state.equipment.filter(e => e.status === 'Maintenance').length;

  container.innerHTML = `
    <div class="stat-card">
      <span class="stat-label">Всього обладнання</span>
      <span class="stat-value">${total}</span>
    </div>
    <div class="stat-card" style="border-bottom: 4px solid var(--status-available-text)">
      <span class="stat-label">Доступно на складі</span>
      <span class="stat-value" style="color: var(--status-available-text)">${available}</span>
    </div>
    <div class="stat-card" style="border-bottom: 4px solid var(--status-issued-text)">
      <span class="stat-label">Видано користувачам</span>
      <span class="stat-value" style="color: var(--status-issued-text)">${issued}</span>
    </div>
    <div class="stat-card" style="border-bottom: 4px solid var(--status-maintenance-text)">
      <span class="stat-label">На обслуговуванні</span>
      <span class="stat-value" style="color: var(--status-maintenance-text)">${maintenance}</span>
    </div>
  `;
}

function formatDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleString('uk-UA', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
}

const statusMap = {
  'Available': { label: 'Доступно', class: 'badge-available' },
  'Issued': { label: 'Видано', class: 'badge-issued' },
  'Maintenance': { label: 'На обслуговуванні', class: 'badge-maintenance' }
};

function renderEquipmentList(equipment) {
  const container = document.getElementById('equipment-list');
  if (equipment.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
        <p>Не знайдено жодного обладнання за цими критеріями</p>
      </div>`;
    return;
  }

  container.innerHTML = equipment.map(eq => `
    <div class="eq-card">
      <div class="eq-header">
        <div>
          <div class="eq-title">${escapeHTML(eq.name)}</div>
          <span class="eq-inv">${escapeHTML(eq.inventoryNumber)}</span>
        </div>
        <span class="badge ${statusMap[eq.status].class}">${statusMap[eq.status].label}</span>
      </div>
      <div class="eq-body">
        <div class="eq-category">${escapeHTML(eq.category)}</div>
        ${eq.description ? `<div class="eq-desc" title="${escapeHTML(eq.description)}">${escapeHTML(eq.description)}</div>` : ''}
        ${eq.status === 'Issued' ? `<div class="eq-assignee">Отримувач: ${escapeHTML(eq.currentAssignee)}</div>` : ''}
      </div>
      <div class="eq-footer">
        <button class="btn btn-secondary btn-icon btn-edit" data-id="${eq.id}" title="Редагувати">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
        </button>
        <button class="btn btn-secondary btn-icon btn-delete" data-id="${eq.id}" title="Списати (Видалити)">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
        </button>
        <div style="flex:1"></div>
        ${getActionButtons(eq)}
      </div>
    </div>
  `).join('');
}

function getActionButtons(eq) {
  if (eq.status === 'Available') {
    return `
      <button class="btn btn-primary btn-sm btn-action" data-id="${eq.id}" data-action="issue">Видати</button>
      <button class="btn btn-secondary btn-sm btn-action" data-id="${eq.id}" data-action="maintenance">В ремонт</button>
    `;
  } else if (eq.status === 'Issued') {
    return `<button class="btn btn-primary btn-sm btn-action" data-id="${eq.id}" data-action="return">Повернути</button>`;
  } else if (eq.status === 'Maintenance') {
    return `<button class="btn btn-primary btn-sm btn-action" data-id="${eq.id}" data-action="return-maintenance">Повернути на склад</button>`;
  }
  return '';
}

function renderHistoryList(logs) {
  const container = document.getElementById('history-list');
  if (logs.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>Історія операцій порожня</p></div>`;
    return;
  }
  
  container.innerHTML = logs.map(log => `
    <div class="history-item">
      <div class="history-time">${formatDate(log.timestamp)}</div>
      <div class="history-content">
        <div class="history-title">${escapeHTML(log.equipmentName)} <span style="font-size: 0.75rem; color: var(--text-muted)">(${log.equipmentId.substring(0,8)}...)</span></div>
        <div class="history-details">${escapeHTML(log.details)}</div>
      </div>
      <div class="history-action-badge">${escapeHTML(log.actionType)}</div>
    </div>
  `).join('');
}

function updateCategories(equipment) {
  const categories = [...new Set(equipment.map(e => e.category))].sort();
  const select = document.getElementById('filter-category');
  const datalist = document.getElementById('category-list');
  
  const currentVal = select.value;
  select.innerHTML = '<option value="">Всі категорії</option>' + categories.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('');
  select.value = currentVal;

  datalist.innerHTML = categories.map(c => `<option value="${escapeHTML(c)}">`).join('');
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}


// --- APP CONTROLLER ---

const state = new State();

// DOM Elements
const views = {
  inventory: document.getElementById('view-inventory'),
  history: document.getElementById('view-history')
};
const tabs = {
  inventory: document.getElementById('tab-inventory'),
  history: document.getElementById('tab-history')
};

// Modals
const modalEq = document.getElementById('modal-equipment');
const formEq = document.getElementById('form-equipment');
const modalAction = document.getElementById('modal-action');
const formAction = document.getElementById('form-action');
const modalConfirm = document.getElementById('modal-confirm');

// Filters
const filters = {
  search: document.getElementById('search-input'),
  category: document.getElementById('filter-category'),
  status: document.getElementById('filter-status'),
  sort: document.getElementById('sort-select')
};
const historySearch = document.getElementById('history-search-input');

// Initialize
state.subscribe(render);
render();

// Routing / Tabs
tabs.inventory.addEventListener('click', () => switchTab('inventory'));
tabs.history.addEventListener('click', () => switchTab('history'));

function switchTab(tabId) {
  Object.values(views).forEach(v => v.classList.remove('active'));
  Object.values(tabs).forEach(t => t.classList.remove('active'));
  views[tabId].classList.add('active');
  tabs[tabId].classList.add('active');
}

// Reset Demo
document.getElementById('reset-demo').addEventListener('click', () => {
  if(confirm("Це знищить усі ваші дані і завантажить демо-дані. Ви впевнені?")) {
    state.resetDemo();
  }
});

// Render Function
function render() {
  renderStats(state);
  updateCategories(state.equipment);
  applyFiltersAndRenderEq();
  applyFiltersAndRenderHistory();
}

// Filtering and Sorting
Object.values(filters).forEach(el => el.addEventListener('input', applyFiltersAndRenderEq));
historySearch.addEventListener('input', applyFiltersAndRenderHistory);

document.getElementById('btn-clear-filters').addEventListener('click', () => {
  filters.search.value = '';
  filters.category.value = '';
  filters.status.value = '';
  filters.sort.value = 'date-desc';
  applyFiltersAndRenderEq();
});

function applyFiltersAndRenderEq() {
  let filtered = state.equipment.filter(eq => {
    const s = filters.search.value.toLowerCase();
    const matchSearch = eq.name.toLowerCase().includes(s) || eq.inventoryNumber.toLowerCase().includes(s);
    const matchCategory = filters.category.value ? eq.category === filters.category.value : true;
    const matchStatus = filters.status.value ? eq.status === filters.status.value : true;
    return matchSearch && matchCategory && matchStatus;
  });

  const sortVal = filters.sort.value;
  filtered.sort((a, b) => {
    if (sortVal === 'date-desc') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortVal === 'date-asc') return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortVal === 'name-asc') return a.name.localeCompare(b.name);
    if (sortVal === 'name-desc') return b.name.localeCompare(a.name);
    if (sortVal === 'inv-asc') return a.inventoryNumber.localeCompare(b.inventoryNumber);
    if (sortVal === 'inv-desc') return b.inventoryNumber.localeCompare(a.inventoryNumber);
    return 0;
  });

  renderEquipmentList(filtered);
}

function applyFiltersAndRenderHistory() {
  const s = historySearch.value.toLowerCase();
  let filtered = state.logs;
  if (s) {
    filtered = state.logs.filter(l => 
      l.equipmentId.toLowerCase().includes(s) || 
      (state.equipment.find(e => e.id === l.equipmentId)?.inventoryNumber.toLowerCase().includes(s))
    );
  }
  renderHistoryList(filtered);
}

// Add/Edit Equipment
document.getElementById('btn-add-equipment').addEventListener('click', () => {
  formEq.reset();
  document.getElementById('eq-id').value = '';
  document.getElementById('modal-title').textContent = 'Додати обладнання';
  clearErrors();
  modalEq.classList.remove('hidden');
});

document.querySelectorAll('.btn-close-modal').forEach(b => {
  b.addEventListener('click', () => modalEq.classList.add('hidden'));
});

formEq.addEventListener('submit', (e) => {
  e.preventDefault();
  clearErrors();
  
  const id = document.getElementById('eq-id').value;
  const data = {
    name: document.getElementById('eq-name').value.trim(),
    inventoryNumber: document.getElementById('eq-inv').value.trim(),
    category: document.getElementById('eq-category').value.trim(),
    description: document.getElementById('eq-desc').value.trim()
  };

  // Validation
  let hasError = false;
  if (!state.isInventoryNumberUnique(data.inventoryNumber, id || null)) {
    document.getElementById('err-eq-inv').textContent = 'Обладнання з таким інвентарним номером вже зареєстроване в системі. Вкажіть унікальний номер';
    hasError = true;
  }
  
  if (hasError) return;

  if (id) {
    state.updateEquipment(id, data);
  } else {
    state.addEquipment(data);
  }
  modalEq.classList.add('hidden');
});

function clearErrors() {
  document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
}

// Equipment List Actions Delegation
document.getElementById('equipment-list').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  
  const id = btn.dataset.id;
  if (btn.classList.contains('btn-edit')) {
    const eq = state.equipment.find(eq => eq.id === id);
    if (!eq) return;
    document.getElementById('eq-id').value = eq.id;
    document.getElementById('eq-name').value = eq.name;
    document.getElementById('eq-inv').value = eq.inventoryNumber;
    document.getElementById('eq-category').value = eq.category;
    document.getElementById('eq-desc').value = eq.description;
    document.getElementById('modal-title').textContent = 'Редагувати обладнання';
    clearErrors();
    modalEq.classList.remove('hidden');
  } 
  else if (btn.classList.contains('btn-delete')) {
    confirmAction('Видалити обладнання назавжди? Ця дія незворотна.', () => state.deleteEquipment(id));
  }
  else if (btn.classList.contains('btn-action')) {
    const action = btn.dataset.action;
    openActionModal(id, action);
  }
});

// Action Modal Logic (Issue, Return)
let currentActionType = null;

function openActionModal(id, action) {
  formAction.reset();
  clearErrors();
  document.getElementById('action-eq-id').value = id;
  currentActionType = action;
  
  const eq = state.equipment.find(e => e.id === id);
  if(!eq) return;

  const groupAssignee = document.getElementById('group-assignee');
  const groupReturn = document.getElementById('group-return-type');
  const assigneeInput = document.getElementById('action-assignee');
  
  if (action === 'issue') {
    document.getElementById('action-title').textContent = `Видача: ${eq.name}`;
    groupAssignee.classList.remove('hidden');
    groupReturn.classList.add('hidden');
    assigneeInput.required = true;
  } else if (action === 'return') {
    document.getElementById('action-title').textContent = `Повернення: ${eq.name}`;
    groupAssignee.classList.add('hidden');
    groupReturn.classList.remove('hidden');
    assigneeInput.required = false;
  } else if (action === 'maintenance') {
    document.getElementById('action-title').textContent = `Відправити на обслуговування: ${eq.name}`;
    groupAssignee.classList.add('hidden');
    groupReturn.classList.add('hidden');
    assigneeInput.required = false;
  } else if (action === 'return-maintenance') {
    document.getElementById('action-title').textContent = `Повернути з обслуговування: ${eq.name}`;
    groupAssignee.classList.add('hidden');
    groupReturn.classList.add('hidden');
    assigneeInput.required = false;
  }

  modalAction.classList.remove('hidden');
}

document.querySelectorAll('.btn-close-action').forEach(b => {
  b.addEventListener('click', () => modalAction.classList.add('hidden'));
});

formAction.addEventListener('submit', (e) => {
  e.preventDefault();
  clearErrors();
  const id = document.getElementById('action-eq-id').value;
  const assignee = document.getElementById('action-assignee').value.trim();
  const comment = document.getElementById('action-comment').value.trim();
  
  if (currentActionType === 'issue') {
    if(assignee.length < 3) {
      document.getElementById('err-action-assignee').textContent = 'Для видачі обладнання необхідно вказати ПІБ отримувача (довжина від 3 до 50 символів)';
      return;
    }
    state.issueEquipment(id, assignee, comment);
  } 
  else if (currentActionType === 'return') {
    const returnType = document.querySelector('input[name="returnType"]:checked').value;
    state.returnEquipment(id, returnType, comment);
  }
  else if (currentActionType === 'maintenance') {
    state.sendToMaintenance(id, comment);
  }
  else if (currentActionType === 'return-maintenance') {
    state.returnFromMaintenance(id, comment);
  }
  
  modalAction.classList.add('hidden');
});

// Confirmation Modal
let confirmCallback = null;

function confirmAction(text, callback) {
  document.getElementById('confirm-text').textContent = text;
  confirmCallback = callback;
  modalConfirm.classList.remove('hidden');
}

document.getElementById('btn-confirm-cancel').addEventListener('click', () => {
  modalConfirm.classList.add('hidden');
  confirmCallback = null;
});

document.getElementById('btn-confirm-ok').addEventListener('click', () => {
  if (confirmCallback) confirmCallback();
  modalConfirm.classList.add('hidden');
});
