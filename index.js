const electron = require("electron");
const express = require('express');
const path = require("path");
const url = require("url");

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const appServer = express();
const serverPort = 3000;

appServer.use(express.static(path.join(__dirname, 'public')));

appServer.get('/createAccount.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'createAccount.html'));
});

appServer.listen(serverPort, () => {
  console.log(`Server is running on http://localhost:${serverPort}`);
});

let win;

function createWindow() {
  win = new BrowserWindow({
    webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        webSecurity: false, 
        allowRunningInsecureContent: true,
    }
  });

  win.loadURL(`http://localhost:${serverPort}/signUp.html`);

  win.on('closed', () => {
    win = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});

