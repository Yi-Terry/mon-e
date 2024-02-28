const { contextBridge, ipcRenderer } = require('electron');

const WINDOW_API = {
  createAccount: (email, password, FirstName, LastName, PhoneNumber) => ipcRenderer.send("createAccount", email, password, FirstName, LastName, PhoneNumber),
  Login: (email, password) => ipcRenderer.send("Login", email, password)
}

const PLAID_API = {
  sendTokenData: (accesstoken, itemid) => ipcRenderer.send("Tokens", accesstoken, itemid)
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
contextBridge.exposeInMainWorld("plaid", PLAID_API);