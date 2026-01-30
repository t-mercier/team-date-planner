const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

const DATA_FILE = path.join(os.homedir(), 'OneDrive - TomTom', 'VE-team-planner', 'availability.json');

// ===== File System Helpers =====
const ensureDataFolder = async () => {
  const folder = path.dirname(DATA_FILE);
  try {
    await fs.access(folder);
  } catch {
    await fs.mkdir(folder, { recursive: true });
  }
};

const ensureDataFile = async () => {
  await ensureDataFolder();
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify({}, null, 2), 'utf8');
  }
};

const readData = async () => {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  try {
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
};

const writeData = async (data) => {
  console.log('💾 Saving to:', DATA_FILE);
  console.log('📦 Data:', JSON.stringify(data, null, 2));
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  console.log('✅ Save complete!');
};

// ===== Window Management =====
const createWindow = () => {
  const win = new BrowserWindow({
    width: 980,
    height: 750,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile('index.html');
};

// ===== App Lifecycle =====
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

// ===== IPC Handlers =====
ipcMain.handle('get-user-availability', async (_event, userName) => {
  const data = await readData();
  return Object.entries(data)
    .filter(([_, users]) => users[userName])
    .map(([date]) => date);
});

ipcMain.handle('save-user-availability', async (_event, userName, dates) => {
  const data = await readData();

  Object.entries(data).forEach(([date, users]) => {
    if (users[userName]) {
      delete users[userName];
      if (Object.keys(users).length === 0) {
        delete data[date];
      }
    }
  });

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

  summary.sort((a, b) => b.count - a.count || a.date.localeCompare(b.date));

  return summary;
});

ipcMain.handle('get-all-users', async () => {
  const data = await readData();
  const usersSet = new Set();

  Object.values(data).forEach(users => {
    Object.keys(users).forEach(name => {
      if (name && typeof name === 'string') {
        usersSet.add(name);
      }
    });
  });

  return Array.from(usersSet).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  );
});
