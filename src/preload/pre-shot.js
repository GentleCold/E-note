const { contextBridge, ipcRenderer } = require('electron');
const ffi = require('ffi-napi');
const path = require('path');
let dir, id;

ipcRenderer.on('path', (e, path, i) => { dir = path; id = i;});
contextBridge.exposeInMainWorld('electronAPI', {
    handleShot: (callback) => {
        ipcRenderer.on('SET_SOURCE', callback);
    },
    buffer: (img) => {
        return new Buffer.from(img).toString('base64');
    },
    close: () => {
        ipcRenderer.send('finish' + id);
    },
    getWin: () => {
        let rectPointer = Buffer.alloc(4 * 4);
        const getWin = new ffi.Library(path.join(dir, 'getWin.dll'), {
            'getWin': // 声明这个dll中的一个函数
            [
              'void', ['pointer'], // 用json的格式罗列其返回类型和参数类型
            ],
        });
        getWin.getWin(rectPointer);
        return RectPointerToRect(rectPointer);
    },
    pin: (w, h, x, y) => {
        ipcRenderer.send('pin', w, h, x, y);
    }
});


// 用于转换从c获得的数组
function RectPointerToRect(rectPointer) {
    let rect = {};
    rect.left = rectPointer.readInt32LE(0);
    rect.top = rectPointer.readInt32LE(4);
    rect.right = rectPointer.readInt32LE(8);
    rect.bottom = rectPointer.readInt32LE(12);
    return rect;
}