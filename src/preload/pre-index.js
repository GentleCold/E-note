const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const iconv = require('iconv-lite');
const jsChardet = require('jschardet');
const path = require('path');
const SearchClass = require('../js/search');
let dir;

ipcRenderer.on('path', (e, path) => { dir = path; });

contextBridge.exposeInMainWorld('electronAPI', {
    handleMenu: (callback) => { ipcRenderer.on('menu:action', callback); },
    sendIfSaved: (ifSaved) => { ipcRenderer.send('save-statue', ifSaved); },
    readText: (file) => { return fs.readFileSync(file, 'binary'); },
    saveText: (file, text, options) => { fs.writeFileSync(file, text, options); },
    decode: (text, code) => { return iconv.decode(text, code) },
    detect:　(text) => { return jsChardet.detect(text); },
    new: () => { ipcRenderer.send('new'); },
    open: () => { ipcRenderer.send('open'); },
    mode: () => { ipcRenderer.send('mode'); },
    change: () => { ipcRenderer.send('change'); },
    image: (image) => { ipcRenderer.send('image', image); },
    warning: (type) => { ipcRenderer.send('warning', type); },
    search: (callback) => { ipcRenderer.on('search', callback); },
    getPath: (name) => { return path.join(dir, name); },
    sendCache: (number) => { ipcRenderer.send('cacheBack', number); },
    getCache: (callback) => { ipcRenderer.on('getCache', callback); },
    deleteCache: (file) => { fs.unlink(file, () => {}); },
    handleClear: (callback) => { ipcRenderer.on('clear', callback); },
});

contextBridge.exposeInMainWorld('searchAPI', {
    result: (target, data) => {
        return new SearchClass().result(target, data);
    }
});