const { contextBridge, ipcRenderer } = require('electron');

const WINDOW_API = {
  createAccount: (email, password, FirstName, LastName, PhoneNumber) => ipcRenderer.send("createAccount", email, password, FirstName, LastName, PhoneNumber),
  Login: (email, password) => ipcRenderer.send("Login", email, password)
}


window.electronAPI = {
  getMainWindow: () => {
    return ipcRenderer.sendSync('get-main-window');
  },
};


window.addEventListener('beforeunload', () => {
  console.log('Renderer process is closing. Logging out of Firebase.');
});

contextBridge.exposeInMainWorld("api", WINDOW_API);