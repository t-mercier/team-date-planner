// Team Date Planner - Main Application
const api = window.availabilityAPI;

// ===== Constants =====
const NAME_MAPPING = {
  'Arnaud': 'Arnaud de Vallois',
  'Cristian': 'Cristian Benghe',
  'Cristina': 'Cristina Dicillo',
  'Daniel': 'Daniel Ribeiro Maciel',
  'Gregory': 'Gregory McCall',
  'Kwok-Po': 'Kwok-Po Chu',
  'Leonardo': 'Leonardo Scandolo',
  'Maarten': 'Maarten Gribnau',
  'Matteo': 'Matteo Mecucci',
  'Ruben': 'Ruben Hamers',
  'Timothée': 'Timothée Mercier',
  'William': 'William Deurwaarder'
};

const STORAGE_KEY = 'team-date-planner:name';

// ===== DOM Elements =====
const elements = {
  nameButtons: document.querySelectorAll('.name-button'),
  nameError: document.getElementById('name-error'),
  monthLabel: document.getElementById('month-label'),
  calendarDays: document.getElementById('calendar-days'),
  saveBtn: document.getElementById('save-btn'),
  statusLabel: document.getElementById('status-label'),
  selectionCount: document.getElementById('selection-count'),
  othersCount: document.getElementById('others-count'),
  summaryList: document.getElementById('summary-list'),
  tabButtons: document.querySelectorAll('.tab-button'),
  tabCalendarCount: document.getElementById('tab-calendar-count'),
  tabSummaryCount: document.getElementById('tab-summary-count'),
  prevMonth: document.getElementById('prev-month'),
  nextMonth: document.getElementById('next-month'),
  todayMonth: document.getElementById('today-month')
};

// ===== Application State =====
const state = {
  currentMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  mySelectedDates: new Set(),
  allSummary: [],
  myName: ''
};

// ===== Utility Functions =====
const formatISODate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatPrettyDate = (iso) => {
  const [year, month, day] = iso.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
};

const pluralize = (count, singular, plural) => count === 1 ? singular : plural;

// ===== UI Update Functions =====
const updateSelectionCount = () => {
  const count = state.mySelectedDates.size;
  elements.selectionCount.textContent = `${count} ${pluralize(count, 'date', 'dates')} selected`;
  elements.tabCalendarCount.textContent = state.myName || 'You';
};

const updateOthersCount = () => {
  const uniqueUsers = new Set();
  state.allSummary.forEach(({ users }) => users.forEach(u => u && uniqueUsers.add(u)));
  if (state.myName) uniqueUsers.delete(state.myName);
  
  const count = uniqueUsers.size;
  elements.othersCount.textContent = `${count} ${pluralize(count, 'teammate', 'teammates')} already picked dates`;
};

const updateStatus = (message) => {
  elements.statusLabel.textContent = message;
};

const showError = (message) => {
  elements.nameError.style.display = 'block';
  elements.nameError.textContent = message;
};

const hideError = () => {
  elements.nameError.style.display = 'none';
};

// ===== Calendar Rendering =====
const renderCalendarHeader = () => {
  elements.monthLabel.textContent = state.currentMonth.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric'
  });
};

const isWeekend = (dayOfWeek) => dayOfWeek === 0 || dayOfWeek === 6;

const createDayCell = (day, bestDates, today) => {
  const dateObj = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth(), day);
  const iso = formatISODate(dateObj);
  
  const cell = document.createElement('div');
  cell.className = 'day-cell';
  cell.dataset.date = iso;

  const mySelected = state.mySelectedDates.has(iso);
  const summaryItem = state.allSummary.find(s => s.date === iso);
  const count = summaryItem?.count || 0;
  const isBest = bestDates.has(iso) && count > 0;
  const isToday = iso === today;

  if (summaryItem?.users.some(u => u !== state.myName)) {
    cell.classList.add('has-others');
  }
  if (mySelected) cell.classList.add('selected');
  if (isBest) cell.classList.add('best-day');
  if (isToday) cell.classList.add('today');

  const dayNumber = document.createElement('div');
  dayNumber.className = 'day-number';
  dayNumber.textContent = day;
  
  const content = document.createElement('div');
  content.className = 'day-content';
  if (count > 0) {
    content.textContent = count;
  }

  cell.append(dayNumber, content);
  cell.addEventListener('click', () => handleDayClick(iso));

  return cell;
};

const renderCalendar = () => {
  renderCalendarHeader();
  elements.calendarDays.innerHTML = '';

  const firstDay = new Date(state.currentMonth);
  const startWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(
    state.currentMonth.getFullYear(),
    state.currentMonth.getMonth() + 1,
    0
  ).getDate();

  const placeholdersNeeded = startWeekday >= 5 ? 0 : startWeekday;
  for (let i = 0; i < placeholdersNeeded; i++) {
    const placeholder = document.createElement('div');
    placeholder.className = 'day-cell disabled';
    elements.calendarDays.appendChild(placeholder);
  }

  const bestCount = state.allSummary[0]?.count || 0;
  const bestDates = new Set(
    state.allSummary.filter(s => s.count === bestCount).map(s => s.date)
  );
  const today = formatISODate(new Date());

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth(), day);
    if (isWeekend(dateObj.getDay())) continue;
    
    elements.calendarDays.appendChild(createDayCell(day, bestDates, today));
  }
};

const handleDayClick = (iso) => {
  if (!state.myName) {
    showError('Please select your name before selecting dates.');
    return;
  }

  if (state.mySelectedDates.has(iso)) {
    state.mySelectedDates.delete(iso);
  } else {
    state.mySelectedDates.add(iso);
  }

  updateStatus('Not saved yet');
  renderCalendar();
  updateSelectionCount();
};

const navigateMonth = (direction) => {
  if (direction === 'today') {
    state.currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  } else {
    state.currentMonth.setMonth(state.currentMonth.getMonth() + (direction === 'next' ? 1 : -1));
  }
  renderCalendar();
};

// ===== Summary View =====
const renderSummary = () => {
  elements.summaryList.innerHTML = '';

  if (!state.allSummary.length) {
    elements.summaryList.innerHTML = 
      '<div class="summary-empty">No availability saved yet. Ask your teammates to open the app and save their dates here.</div>';
    elements.tabSummaryCount.textContent = '0';
    return;
  }

  const bestCount = state.allSummary[0].count;
  elements.tabSummaryCount.textContent = String(state.allSummary.length);

  state.allSummary.forEach(item => {
    const row = document.createElement('div');
    row.className = 'summary-row';
    if (item.count === bestCount && item.count > 0) {
      row.classList.add('best');
    }

    const dateEl = document.createElement('div');
    dateEl.className = 'summary-date';
    dateEl.textContent = formatPrettyDate(item.date);

    const countEl = document.createElement('div');
    countEl.className = 'summary-count';
    const pill = document.createElement('div');
    pill.className = 'summary-count-pill';
    if (item.count >= 3) pill.classList.add('strong');
    pill.textContent = `${item.count} ${pluralize(item.count, 'person', 'people')}`;
    countEl.appendChild(pill);
    
    const usersEl = document.createElement('div');
    usersEl.className = 'summary-users';
    usersEl.textContent = item.users.join(', ');

    row.append(dateEl, countEl, usersEl);
    elements.summaryList.appendChild(row);
  });
};// ===== Data Management =====
const loadData = async () => {
  if (!state.myName) return;
  
  try {
    const [myDates, summaryData] = await Promise.all([
      api.getUserAvailability(state.myName),
      api.getSummary()
    ]);
    
    state.mySelectedDates = new Set(myDates || []);
    state.allSummary = summaryData || [];
    
    updateStatus('Loaded from shared calendar');
    updateSelectionCount();
    updateOthersCount();
    renderCalendar();
    renderSummary();
  } catch (err) {
    console.error('Error loading data:', err);
    updateStatus('Could not load data (check file access).');
  }
};

const saveData = async () => {
  if (!state.myName) {
    showError('Please select your name before saving.');
    return;
  }

  elements.saveBtn.disabled = true;
  elements.saveBtn.textContent = 'Saving…';
  hideError();

  try {
    await api.saveUserAvailability(state.myName, Array.from(state.mySelectedDates));
    const summaryData = await api.getSummary();
    state.allSummary = summaryData || [];
    
    updateStatus('Saved to shared calendar ✓');
    renderCalendar();
    renderSummary();
    updateOthersCount();
  } catch (err) {
    console.error('Error saving:', err);
    updateStatus('Error while saving. Check folder permissions.');
  } finally {
    elements.saveBtn.disabled = false;
    elements.saveBtn.textContent = 'Save my availability';
  }
};

// ===== Tab Management =====
const switchTab = (tab) => {
  elements.tabButtons.forEach(btn => {
    const isActive = btn.dataset.tab === tab;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', String(isActive));
  });

  document.querySelectorAll('[data-tab-content]').forEach(section => {
    section.style.display = section.getAttribute('data-tab-content') === tab ? '' : 'none';
  });
};

// ===== Name Management =====
const highlightNameButton = (fullName) => {
  const firstName = Object.keys(NAME_MAPPING).find(key => NAME_MAPPING[key] === fullName);
  
  elements.nameButtons.forEach(button => {
    const isActive = button.dataset.name === firstName;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-checked', String(isActive));
  });
};

const initNameSelection = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    state.myName = stored;
    highlightNameButton(stored);
    elements.tabCalendarCount.textContent = stored;
  }

  elements.nameButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const firstName = button.dataset.name;
      const fullName = NAME_MAPPING[firstName];
      
      state.myName = fullName;
      elements.tabCalendarCount.textContent = fullName;
      localStorage.setItem(STORAGE_KEY, fullName);
      
      highlightNameButton(fullName);
      await loadData();
      hideError();
    });
  });
};

// ===== Event Listeners & Initialization =====
const init = () => {
  elements.prevMonth.addEventListener('click', () => navigateMonth('prev'));
  elements.nextMonth.addEventListener('click', () => navigateMonth('next'));
  elements.todayMonth.addEventListener('click', () => navigateMonth('today'));
  elements.saveBtn.addEventListener('click', saveData);
  elements.tabButtons.forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

  initNameSelection();
  renderCalendar();
  
  if (state.myName) {
    loadData();
  } else {
    api.getSummary()
      .then(summaryData => {
        state.allSummary = summaryData || [];
        updateOthersCount();
        renderCalendar();
        renderSummary();
      })
      .catch(err => console.error('Error during initial load:', err));
  }
};

init();
