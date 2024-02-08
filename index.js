const { app, BrowserWindow, session, ipcMain, dialog, ipcRenderer} = require('electron');
const express = require('express');
const path = require('node:path');
const bcrypt = require("bcryptjs");
const firebase = require("firebase/app");
const { getDatabase, set, ref } = require("firebase/database");
const {getAuth, createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, onAuthStateChanged} = require("firebase/auth");

const firebaseConfig = {
  apiKey: "AIzaSyAuj-AVSSgdL9QKDvCr6C4WBfb_o_RhiR8",
  authDomain: "mon-e-2dbd6.firebaseapp.com",
  projectId: "mon-e-2dbd6",
  storageBucket: "mon-e-2dbd6.appspot.com",
  messagingSenderId: "983558902043",
  appId: "1:983558902043:web:93b3e671eeafa0a99503be"
};

var fapp = firebase.initializeApp(firebaseConfig);
const database = getDatabase(fapp);
const auth = getAuth(fapp);


const appServer = express();
const serverPort = 3000;

appServer.use(express.static(path.join(__dirname, 'public')));

appServer.get('/createAccount.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'createAccount.html'));
});

appServer.get('/index.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.js'));
});

appServer.get('/renderer.js', (req, res) => {
  res.sendFile(path.join(__dirname, './renderer.js'));
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
      nodeIntegration: true,
      contextIsolation: true,
      webSecurity: true,
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

//ipcMain listens for any requests from frontend and sends them to backend. This is Username and Password Signup.
ipcMain.on("createAccount", (event, email, password, FirstName, LastName, PhoneNumber) =>{
createUserWithEmailAndPassword(auth, email, password)
.then((userCredential) => {
  const user = userCredential.user;
  hash = bcrypt.hashSync(password, 12);
  password = hash
  set(ref(database, 'users/' + user.uid),{
      FirstName: FirstName,
      LastName: LastName,
      PhoneNumber: PhoneNumber,
      email: email,
      password: password,
      created_at: Date.now(),
  })
  .then(() => {
      sendEmailVerification(user);
      dialog.showMessageBox({
          type: 'question',
          buttons: ['Ok'],
          defaultId: 2,
          message: 'Account Created!',
          detail: 'Email Verification Link has been sent',
        });
        win.loadURL(`http://localhost:${serverPort}/signUp.html`);
  })
  .catch((error) => {
  });
})
    .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;

    dialog.showMessageBox({
        type: 'question',
        buttons: ['Ok'],
        title: 'Error Creating Account.',
        cancelId: 99,
        message: errorMessage
    });
  })
});

ipcMain.on("Login", (event, email, password) =>{
  signInWithEmailAndPassword(auth, email, password)
  .then((userCredential) => {
      const user = userCredential.user;
      if (user.emailVerified) {
          console.log('user signed in')
          win.loadURL(`http://localhost:${serverPort}/homePage.html`);
      } else {
        dialog.showMessageBox({
          type: 'question',
          buttons: ['Ok'],
          title: 'Error Logging In.',
          cancelId: 99,
          message: 'Email not verified. New Verification Link sent to Email!'
        });
          sendEmailVerification(user)
      }
})
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    dialog.showMessageBox({
      type: 'question',
      buttons: ['Ok'],
      title: 'Error Logging In.',
      cancelId: 99,
      message: errorMessage
    });
  });
  onAuthStateChanged(auth, (user) => {
    if (user) {
      var isVerified = user.emailVerified;
      if(isVerified){
        win.loadURL(`http://localhost:${serverPort}/homePage.html`);
      }
    } else {
    }
  })
});
