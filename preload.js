const { contextBridge, ipcRenderer } = require('electron');

const WINDOW_API = {
  createAccount: (email, password, FirstName, LastName, PhoneNumber) => ipcRenderer.send("createAccount", email, password, FirstName, LastName, PhoneNumber),
  Login: (email, password) => ipcRenderer.send("Login", email, password),
  GoogleLogIN: (user) => ipcRenderer.send("GoogleSignIn", user),
  AppleLogIN: (user) => ipcRenderer.send("AppleSignIn", user),
  Error: (message) => ipcRenderer.send("ErrorMessage", message)
}

const PLAID_API = {
  sendToken: (accesstoken, itemid, currentUser) => ipcRenderer.send("sendTokenCurrentUser", accesstoken, itemid, currentUser),
}


const ADMIN_API = {
  MakeUser: (email, password, PhoneNumber, displayName) => ipcRenderer.send("MakeUser", email, password, PhoneNumber, displayName),
  Deactivate: (userID) => ipcRenderer.send("DeactivateUser", userID),
  Activate: (userID) => ipcRenderer.send("ActivateUser", userID),
  UpdateUser: (userID, email, password, displayName) => ipcRenderer.send("UpdateUser", userID, email, password, displayName),
  MakeAdmin: (userID) => ipcRenderer.send("MakeUserAdmin", userID),
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
contextBridge.exposeInMainWorld("admin", ADMIN_API);