const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('availabilityAPI', {
  getUserAvailability: (userName) => ipcRenderer.invoke('get-user-availability', userName),
  saveUserAvailability: (userName, dates) => ipcRenderer.invoke('save-user-availability', userName, dates),
  getSummary: () => ipcRenderer.invoke('get-summary'),
  getAllUsers: () => ipcRenderer.invoke('get-all-users'),
});
