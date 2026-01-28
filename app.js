// Team Date Planner - Main Application
const api = window.availabilityAPI;

// ===== Name Mapping =====
const nameMapping = {
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

// ===== DOM Elements =====
const elements = {
  nameButtons: Array.from(document.querySelectorAll('.name-button')),
  nameError: document.getElementById('name-error'),
  monthLabel: document.getElementById('month-label'),
  calendarDays: document.getElementById('calendar-days'),
  saveBtn: document.getElementById('save-btn'),
  statusLabel: document.getElementById('status-label'),
  selectionCount: document.getElementById('selection-count'),
  othersCount: document.getElementById('others-count'),
  summaryList: document.getElementById('summary-list'),
  tabButtons: Array.from(document.querySelectorAll('.tab-button')),
  tabCalendarCount: document.getElementById('tab-calendar-count'),
  tabSummaryCount: document.getElementById('tab-summary-count')
};

// ===== Application State =====
const state = {
  currentMonth: new Date(),
  mySelectedDates: new Set(),
  allSummary: [],
  myName: ''
};
state.currentMonth.setDate(1);

// ===== Utility Functions =====
const utils = {
  formatISODate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  formatPrettyDate(iso) {
    const [year, month, day] = iso.split('-').map(x => parseInt(x, 10));
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  },

  pluralize(count, singular, plural) {
    return count === 1 ? singular : plural;
  }
};

// ===== UI Update Functions =====
const ui = {
  updateSelectionCount() {
    const count = state.mySelectedDates.size;
    elements.selectionCount.textContent = `${count} ${utils.pluralize(count, 'date', 'dates')} selected`;
    elements.tabCalendarCount.textContent = state.myName || 'You';
  },

  updateOthersCount() {
    const uniqueUsers = new Set();
    state.allSummary.forEach(item => {
      item.users.forEach(u => {
        if (u) uniqueUsers.add(u);
      });
    });
    if (state.myName) uniqueUsers.delete(state.myName);
    
    const count = uniqueUsers.size;
    elements.othersCount.textContent = `${count} ${utils.pluralize(count, 'teammate', 'teammates')} already picked dates`;
  },

  updateStatus(message) {
    elements.statusLabel.textContent = message;
  },

  showError(message) {
    elements.nameError.style.display = 'block';
    elements.nameError.textContent = message;
  },

  hideError() {
    elements.nameError.style.display = 'none';
  }
};

// ===== Calendar Rendering =====
const calendar = {
  render() {
    this.renderHeader();
    this.renderDays();
  },

  renderHeader() {
    elements.monthLabel.textContent = state.currentMonth.toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric'
    });
  },

  renderDays() {
    elements.calendarDays.innerHTML = '';

    const firstDay = new Date(state.currentMonth);
    const startWeekday = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(
      state.currentMonth.getFullYear(),
      state.currentMonth.getMonth() + 1,
      0
    ).getDate();

    // Add placeholder cells for days before the month starts (weekdays only)
    const placeholdersNeeded = startWeekday > 5 ? 0 : startWeekday;
    for (let i = 0; i < placeholdersNeeded; i++) {
      const placeholder = document.createElement('div');
      placeholder.className = 'day-cell disabled';
      elements.calendarDays.appendChild(placeholder);
    }

    const bestCount = state.allSummary.length > 0 ? state.allSummary[0].count : 0;
    const bestDates = new Set(
      state.allSummary.filter(s => s.count === bestCount).map(s => s.date)
    );

    const today = utils.formatISODate(new Date());

    // Render actual days (weekdays only)
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(
        state.currentMonth.getFullYear(),
        state.currentMonth.getMonth(),
        day
      );
      const dayOfWeek = dateObj.getDay();
      
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        continue;
      }
      
      const cell = this.createDayCell(day, bestDates, bestCount, today);
      elements.calendarDays.appendChild(cell);
    }
  },

  createDayCell(day, bestDates, bestCount, today) {
    const dateObj = new Date(
      state.currentMonth.getFullYear(),
      state.currentMonth.getMonth(),
      day
    );
    const iso = utils.formatISODate(dateObj);

    const cell = document.createElement('div');
    cell.className = 'day-cell';
    cell.dataset.date = iso;

    const mySelected = state.mySelectedDates.has(iso);
    const summaryItem = state.allSummary.find(s => s.date === iso);
    const count = summaryItem ? summaryItem.count : 0;
    const isBest = bestDates.has(iso) && count > 0;
    const isToday = iso === today;

    // Apply cell classes
    if (summaryItem && summaryItem.users.some(u => u !== state.myName)) {
      cell.classList.add('has-others');
    }
    if (mySelected) {
      cell.classList.add('selected');
    }
    if (isBest) {
      cell.classList.add('best-day');
    }
    if (isToday) {
      cell.classList.add('today');
    }

    // Build cell content
    cell.appendChild(this.createDayNumber(day));
    cell.appendChild(this.createDayContent(mySelected, count));

    // Add click handler
    cell.addEventListener('click', () => this.handleDayClick(iso));

    return cell;
  },

  createDayNumber(day) {
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = day;
    return dayNumber;
  },

  createDayContent(mySelected, count) {
    const content = document.createElement('div');
    content.className = 'day-content';

    const dots = this.createDots(mySelected, count);
    const badge = this.createBadge(count);

    content.appendChild(dots);
    content.appendChild(badge);
    return content;
  },

  createDots(mySelected, count) {
    const dots = document.createElement('div');
    dots.className = 'dot-row';

    const myDot = document.createElement('div');
    myDot.className = 'dot';
    if (mySelected) myDot.classList.add('mine');
    dots.appendChild(myDot);

    if (count > (mySelected ? 1 : 0)) {
      const othersDot = document.createElement('div');
      othersDot.className = 'dot others';
      dots.appendChild(othersDot);
    }

    return dots;
  },

  createBadge(count) {
    const badge = document.createElement('div');
    badge.className = 'day-badge';
    badge.textContent = count === 0 ? '–' : `${count} going`;
    return badge;
  },

  handleDayClick(iso) {
    if (!state.myName) {
      ui.showError('Please select your name before selecting dates.');
      return;
    }

    if (state.mySelectedDates.has(iso)) {
      state.mySelectedDates.delete(iso);
    } else {
      state.mySelectedDates.add(iso);
    }

    ui.updateStatus('Not saved yet');
    this.render();
    ui.updateSelectionCount();
  },

  navigate(direction) {
    if (direction === 'today') {
      state.currentMonth = new Date();
      state.currentMonth.setDate(1);
    } else {
      state.currentMonth.setMonth(state.currentMonth.getMonth() + (direction === 'next' ? 1 : -1));
    }
    this.render();
  }
};

// ===== Summary View =====
const summary = {
  render() {
    elements.summaryList.innerHTML = '';

    if (!state.allSummary.length) {
      this.renderEmpty();
      return;
    }

    const bestCount = state.allSummary[0].count;
    elements.tabSummaryCount.textContent = String(state.allSummary.length);

    state.allSummary.forEach(item => {
      const row = this.createSummaryRow(item, bestCount);
      elements.summaryList.appendChild(row);
    });
  },

  renderEmpty() {
    elements.summaryList.innerHTML = 
      '<div class="summary-empty">No availability saved yet. Ask your teammates to open the app and save their dates here.</div>';
    elements.tabSummaryCount.textContent = '0';
  },

  createSummaryRow(item, bestCount) {
    const row = document.createElement('div');
    row.className = 'summary-row';
    if (item.count === bestCount && item.count > 0) {
      row.classList.add('best');
    }

    const dateEl = document.createElement('div');
    dateEl.className = 'summary-date';
    dateEl.textContent = utils.formatPrettyDate(item.date);

    const countEl = this.createCountElement(item.count);
    
    const usersEl = document.createElement('div');
    usersEl.className = 'summary-users';
    usersEl.textContent = item.users.join(', ');

    row.appendChild(dateEl);
    row.appendChild(countEl);
    row.appendChild(usersEl);

    return row;
  },

  createCountElement(count) {
    const countEl = document.createElement('div');
    countEl.className = 'summary-count';

    const pill = document.createElement('div');
    pill.className = 'summary-count-pill';
    if (count >= 3) pill.classList.add('strong');
    pill.textContent = `${count} ${utils.pluralize(count, 'person', 'people')}`;

    countEl.appendChild(pill);
    return countEl;
  }
};



// ===== Data Management =====
const data = {
  async loadForName() {
    if (!state.myName) return;
    
    try {
      const [myDates, summaryData] = await Promise.all([
        api.getUserAvailability(state.myName),
        api.getSummary()
      ]);
      
      state.mySelectedDates = new Set(myDates || []);
      state.allSummary = summaryData || [];
      
      ui.updateStatus('Loaded from shared calendar');
      ui.updateSelectionCount();
      ui.updateOthersCount();
      calendar.render();
      summary.render();
    } catch (err) {
      console.error('Error loading data:', err);
      ui.updateStatus('Could not load data (check file access).');
    }
  },

  async save() {
    if (!state.myName) {
      ui.showError('Please select your name before saving.');
      return;
    }

    elements.saveBtn.disabled = true;
    elements.saveBtn.textContent = 'Saving…';
    ui.hideError();

    try {
      await api.saveUserAvailability(state.myName, Array.from(state.mySelectedDates));
      const summaryData = await api.getSummary();
      state.allSummary = summaryData || [];
      
      ui.updateStatus('Saved to shared calendar ✓');
      calendar.render();
      summary.render();
      ui.updateOthersCount();
    } catch (err) {
      console.error('Error saving:', err);
      ui.updateStatus('Error while saving. Check folder permissions.');
    } finally {
      elements.saveBtn.disabled = false;
      elements.saveBtn.textContent = 'Save my availability';
    }
  }
};

// ===== Tab Management =====
const tabs = {
  switch(tab) {
    elements.tabButtons.forEach(btn => {
      const isActive = btn.dataset.tab === tab;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    document.querySelectorAll('[data-tab-content]').forEach(section => {
      const show = section.getAttribute('data-tab-content') === tab;
      section.style.display = show ? '' : 'none';
    });
  }
};

// ===== Name Management =====
const nameManager = {
  init() {
    const stored = localStorage.getItem('team-date-planner:name');
    if (stored) {
      state.myName = stored;
      this.highlightNameButton(stored);
      elements.tabCalendarCount.textContent = stored;
    }

    elements.nameButtons.forEach(button => {
      button.addEventListener('click', async () => {
        const firstName = button.dataset.name;
        const fullName = nameMapping[firstName];
        
        state.myName = fullName;
        elements.tabCalendarCount.textContent = fullName;
        localStorage.setItem('team-date-planner:name', fullName);
        
        this.highlightNameButton(fullName);
        await data.loadForName();
        ui.hideError();
      });
    });
  },

  highlightNameButton(fullName) {
    // Find the first name from the full name
    const firstName = Object.keys(nameMapping).find(key => nameMapping[key] === fullName);
    
    elements.nameButtons.forEach(button => {
      if (button.dataset.name === firstName) {
        button.classList.add('active');
        button.setAttribute('aria-checked', 'true');
      } else {
        button.classList.remove('active');
        button.setAttribute('aria-checked', 'false');
      }
    });
  }
};

// ===== Event Listeners =====
function setupEventListeners() {
  document.getElementById('prev-month').addEventListener('click', () => calendar.navigate('prev'));
  document.getElementById('next-month').addEventListener('click', () => calendar.navigate('next'));
  document.getElementById('today-month').addEventListener('click', () => calendar.navigate('today'));
  
  elements.saveBtn.addEventListener('click', () => data.save());
  
  elements.tabButtons.forEach(btn => {
    btn.addEventListener('click', () => tabs.switch(btn.dataset.tab));
  });
}

// ===== Application Bootstrap =====
async function bootstrap() {
  nameManager.init();
  calendar.render();
  
  if (state.myName) {
    await data.loadForName();
  } else {
    try {
      const summaryData = await api.getSummary();
      state.allSummary = summaryData || [];
      ui.updateOthersCount();
      calendar.render();
      summary.render();
    } catch (err) {
      console.error('Error during initial load:', err);
    }
  }
}

// Initialize the application
setupEventListeners();
bootstrap();
