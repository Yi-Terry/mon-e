const { ipcRenderer } = require('electron');

window.electronAPI = {
  getMainWindow: () => {
    return ipcRenderer.sendSync('get-main-window');
  },
};


window.addEventListener('beforeunload', () => {
  console.log('Renderer process is closing. Logging out of Firebase.');
});
