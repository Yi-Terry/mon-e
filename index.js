console.log("main process working");

console.log('main.js');



const electron =  require("electron");

const app = electron.app;

const BrowserWindow = electron.BrowserWindow;

const path = require("path");

const url = require("url");



let win;


function createWindow(){ //creates window

    win = new BrowserWindow({

        webPreferences:{

            nodeIntegration:true,

            contextIsolation:false,

        }

    });



    win.loadURL(url.format({ //loads signup page

        pathname: path.join(__dirname, 'signUp.html'),

        protocol: 'file',

        slashes: true

    }));



    

    // win.webContents.openDevTools(); //just here to check for some stuff, remove later


    



    win.on('closed', ()=>{

        win = null;

    })

}



app.on('ready', createWindow);



app.on('window-all-closed', () =>{

    if(process.platform !== 'darwin'){

        app.quit()

    }

});



app.on('activate', ()=> {

    if(win === null){

        createWindow()

    }

});