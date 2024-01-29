const { app, BrowserWindow, session, ipcMain } = require('electron');
const express = require('express');
const path = require('path');

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

ipcMain.on('get-main-window', (event) => {
  event.returnValue = win;
});

function createWindow() {
  win = new BrowserWindow({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      allowRunningInsecureContent: true,
      preload: path.join(__dirname, 'preload.js'), // Add this line
    }
  });

  win.loadURL(`http://localhost:${serverPort}/signUp.html`);

  win.on('closed', () => {
    session.defaultSession.clearStorageData({
      storages: ['cookies']
    }, function (error) {
      if (error) {
        console.error('Error clearing cookies:', error);
      } else {
        console.log('Cookies cleared');
      }
    });

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

