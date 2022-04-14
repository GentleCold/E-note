const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
    show: (callback) => {
        ipcRenderer.on('show', callback);
    },
    realImage: (width, height) =>　{
        ipcRenderer.send('realImage', width, height);
    },
    close: (id) => {
        ipcRenderer.send('close' + id);
    }
});