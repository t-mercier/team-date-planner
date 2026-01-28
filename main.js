const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;

const DATA_FILE = path.join(__dirname, 'availability.json');

async function ensureDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify({}, null, 2), 'utf8');
  }
}

async function readData() {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  try {
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
}

async function writeData(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('get-user-availability', async (_event, userName) => {
  const data = await readData();
  const result = [];
  for (const [date, users] of Object.entries(data)) {
    if (users[userName]) {
      result.push(date);
    }
  }
  return result;
});

ipcMain.handle('save-user-availability', async (_event, userName, dates) => {
  const data = await readData();

  // Clear previous entries for this user
  for (const [date, users] of Object.entries(data)) {
    if (users[userName]) {
      delete users[userName];
    }
    if (Object.keys(users).length === 0) {
      delete data[date];
    }
  }

  // Add new dates
  dates.forEach((date) => {
    if (!data[date]) data[date] = {};
    data[date][userName] = true;
  });

  await writeData(data);
  return true;
});

ipcMain.handle('get-summary', async () => {
  const data = await readData();
  const summary = Object.entries(data).map(([date, users]) => ({
    date,
    count: Object.keys(users).length,
    users: Object.keys(users).sort(),
  }));

  summary.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.date.localeCompare(b.date);
  });

  return summary;
});

ipcMain.handle('get-all-users', async () => {
  const data = await readData();
  const usersSet = new Set();

  for (const users of Object.values(data)) {
    for (const name of Object.keys(users)) {
      if (name && typeof name === 'string') {
        usersSet.add(name);
      }
    }
  }

  return Array.from(usersSet).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  );
});



