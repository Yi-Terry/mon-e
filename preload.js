const { contextBridge, ipcRenderer } = require('electron');

const WINDOW_API = {
  createAccount: (email, password, FirstName, LastName, PhoneNumber) => ipcRenderer.send("createAccount", email, password, FirstName, LastName, PhoneNumber),
  Login: (email, password) => ipcRenderer.send("Login", email, password),
  GoogleLogIN: (user) => ipcRenderer.send("GoogleSignIn", user),
  Error: (message) => ipcRenderer.send("ErrorMessage", message)
}

const PLAID_API = {
  sendToken: (accesstoken, itemid, currentUser) => ipcRenderer.send("sendTokenCurrentUser", accesstoken, itemid, currentUser),
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