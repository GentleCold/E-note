const { app, BrowserWindow, Menu, MenuItem, dialog, ipcMain, globalShortcut } = require('electron');
const Store = require('electron-store');
const screenshot = require('screenshot-desktop');
const path = require('path');
const fs = require('fs');
const store = new Store();
const appMenuTemplate = require('./js/appmenu');
const appMenuFalse = require('./js/appmenu-false');

let currentFile = undefined;
let ifSaved = true;
let ifOpened = false;
let ifShot = false;
let top = false;
let note;
let menu;
let mainWin;

// create function to handle menu action
const handleMenu = {
    toTop: () => {
        mainWin.setAlwaysOnTop(true);
        if (!ifOpened) handleMenu.new().then();
        mainWin.setMinimumSize(250, 350);
        mainWin.setSize(0, 0, true);
        mainWin.setPosition(1920 - 630, 30);
        top = true;
    },

    fromTop: () => {
        mainWin.setAlwaysOnTop(false);
        mainWin.setMinimumSize(550, 600);
        mainWin.setSize(800, 600, true);
        mainWin.center();
        top = false;
    },

    handleTop: () => {
        if (!top) {
            handleMenu.toTop();
        } else {
            handleMenu.fromTop();
        }
    },

    handleSave: async () => {
        const { response } = await dialog.showMessageBox(mainWin, {
            message: 'Do you want to save the current document?',
            type: 'question',
            buttons: ['Yes', 'No', 'Cancel'],
            icon:　path.join(__dirname, 'image/Save.ico'),
        });

        if (response === 0) {
            return await handleMenu.save(mainWin);
        } else if (response === 1) {
            ifSaved = false;
            mainWin.webContents.send('clear');
            return false;
        } else if (response === 2) {
            return true;
        }
    },

    handleShot: () => {
        if (!ifShot) {
            createShotWindow();
            ifShot = true;
        }
    },

    new: async () => {
        ifOpened = true;
        let ifCancel = false;
        if (!ifSaved) ifCancel = await handleMenu.handleSave();
        if (!ifCancel) {

            // handle if delete the currentFile
            if (currentFile) {
                try {
                    fs.readFileSync(currentFile, 'utf8');
                } catch (e) {
                    // console.log(e);
                    if (ifSaved) {
                        ifSaved = await handleMenu.handleSave();
                        if (ifSaved) {
                            ifSaved = false;
                            return;
                        }
                    }
                }
            }

            currentFile = undefined;
            store.set('filePath', false);
            mainWin.webContents.send('menu:action', 'new');
        }
    },

    // the background is set to change background
    open: async (filePath, background) => {
        if (background) {
            const { canceled, filePaths } = await dialog.showOpenDialog(mainWin, {
                filters: [
                    { name: "Picture Files", extensions: ['jpg'] },
                ],
                properties: ['openFile'],
            });
            if (!canceled) {
                fs.readFile(filePaths[0], 'binary', (err, date) => {
                    fs.writeFileSync(path.dirname(app.getPath('exe')) + '\\background.jpg', date, 'binary'); // path!
                });
                if (ifOpened) {
                    const { response } = await dialog.showMessageBox(mainWin, {
                        message: 'Restart to take effect, restart now?',
                        type: 'warning',
                        buttons: ['yes', 'no'],
                        icon: path.join(__dirname, 'image/power.ico'),
                    });
                    if (response === 0) {
                        if (!ifSaved) {
                            const flag = await handleMenu.handleSave();
                            if (!flag) {
                                createIndexWindow();
                                ifSaved = true;
                                mainWin.close();
                                return;
                            }
                        }
                        createIndexWindow();
                        mainWin.close();
                    }
                } else {
                    mainWin.reload();
                }
            }
            return;
        }

        let ifCancel = false;
        if (!ifSaved) ifCancel = await handleMenu.handleSave();
        if (!ifCancel) {
            if (filePath) {
                currentFile = filePath;
                ifOpened = true;
                // if opened by txt, then update
                store.set('filePath', filePath);
                try {
                    fs.readFileSync(filePath, 'utf8');
                } catch (e) {
                    currentFile = undefined;
                    ifOpened = false;
                    store.set('filePath', false);
                    return;
                }
                mainWin.webContents.send('menu:action', 'open', currentFile);
                return;
            }

            // if delete the currentFile
            if (currentFile) {
                try {
                    fs.readFileSync(currentFile, 'utf8');
                } catch (e) {
                    if (ifSaved) {
                        ifSaved = await handleMenu.handleSave();
                        if (ifSaved) {
                            ifSaved = false;
                            return;
                        }
                    }
                }
            }

            const { canceled, filePaths } = await dialog.showOpenDialog(mainWin, {
                filters: [
                    { name: "Text Files", extensions: ['txt'] },
                    { name: 'All Files', extensions: ['*'] }
                ],
                properties: ['openFile'],
            });
            if (!canceled) {
                ifOpened = true;
                currentFile = filePaths[0];
                // save the path to open it next time
                store.set('filePath', currentFile);
                mainWin.webContents.send('menu:action', 'open', currentFile);
            }
        }
    },

    saveAs: async (ifPlainText) => {
        if(!ifOpened) {
            await dialog.showMessageBox(mainWin, {
                message: 'Please open a file first!',
                type: 'warning',
                buttons: [],
                icon: path.join(__dirname, 'image/folder.ico'),
            });
            return true;
        }
        const { canceled, filePath } = await dialog.showSaveDialog(mainWin, {
            filters: [
                { name: "Text Files", extensions: ['txt'] },
                { name: 'All Files', extensions: ['*'] }
            ],
        });

        // the filePath(not filePaths) is not an array in this case
        if (!canceled) {
            currentFile = filePath;
            store.set('filePath', currentFile);
            mainWin.webContents.send('menu:action', 'save', currentFile, ifPlainText);
        }
        return canceled;
    },

    save: async () => {
        if (currentFile) {
            if(!ifOpened) {
                await dialog.showMessageBox(mainWin, {
                    message: 'Please open a file first',
                    type: 'warning',
                    buttons: [],
                });
                return true;
            }
            mainWin.webContents.send('menu:action', 'save', currentFile);
            return false;
        } else {
            return await handleMenu.saveAs();
        }
    },

    home: async () => {
        let ifCancel = false;
        if (!ifSaved) ifCancel = await handleMenu.handleSave();
        if (!ifCancel) {
            ifOpened = false;
            ifSaved = true;
            currentFile =  null;
            store.set('filePath', false);
            mainWin.webContents.send('menu:action', 'home');
        }
        return flag;
    }
};

// create a standard menu for
const createMenu = () => {
    menu = Menu.buildFromTemplate(appMenuTemplate);
    // add 'New' option
    menu.items[0].submenu.append(new MenuItem({
        label: "New",
        click: () => { return handleMenu.new(); },
        accelerator: 'CmdOrCtrl+N',
    }));
    // add 'Open' option
    menu.items[0].submenu.append(new MenuItem({
        label: "Open",
        click: () => { return handleMenu.open(null); },
        accelerator: 'CmdOrCtrl+O',
    }));
    // add 'Save' option
    menu.items[0].submenu.append(new MenuItem({
        label: "Save",
        click: () => { return handleMenu.save(); },
        accelerator: 'CmdOrCtrl+S',
    }));
    // add 'Save As...' option
    menu.items[0].submenu.append(new MenuItem({
        label: "Save As...",
        click: () => { return handleMenu.saveAs(); },
        accelerator: 'CmdOrCtrl+Shift+S',
    }));
    // add 'Save As Plain Text...' option
    menu.items[0].submenu.append(new MenuItem({
        label: "Save As Plain Text...",
        click: () => { return handleMenu.saveAs(true); },
        accelerator: 'Alt+S',
    }));
    // add a separator
    menu.items[0].submenu.append(new MenuItem({
        type: 'separator'
    }));
    // add 'Exit' option
    menu.items[0].submenu.append(new MenuItem({
        role: 'quit',
        accelerator: 'Esc'
    }));
    // add 'search' option
    menu.items[2].submenu.append(new MenuItem({
        label: 'Search',
        click: () => { mainWin.webContents.send('search'); },
        accelerator: 'CmdOrCtrl+F',
    }));
    // add 'screenshot' option
    menu.items[2].submenu.append(new MenuItem({
        label: 'Screen Shot',
        click: () => { handleMenu.handleShot(); },
        accelerator: 'CmdOrCtrl+E',
    }));
    // add 'note' option
    note = new MenuItem({
        label: 'Note Mode',
        type: 'checkbox',
        click: () => handleMenu.handleTop(),
        accelerator: 'CmdOrCtrl+Q',
    })
    menu.items[2].submenu.append(note);
    // add a separator
    menu.items[2].submenu.append(new MenuItem({
        type: 'separator'
    }));
    menu.items[2].submenu.append(new MenuItem({
        role: 'togglefullscreen'
    }));
    // add 'change background' option
    menu.items[2].submenu.append(new MenuItem({
        label: 'Change Background',
        click: () => { return handleMenu.open(null, true); },
    }));
    // add 'Home' option
    menu.append(new MenuItem({
        label: 'Home',
        click: () => {
            handleMenu.home().then((ifHome) => {
                if (!ifHome) {
                    if (note.checked) {
                        note.checked = false;
                        handleMenu.fromTop();
                    }
                }
            });
        },
        accelerator: '`'
    }))

    Menu.setApplicationMenu(menu);
};

// create the ipcMain to receive the message
const indexListener = () => {
    ipcMain.on('save-statue', (event, statue) => { ifSaved = statue; });
    ipcMain.on('open', () => { handleMenu.open(null).then(); });
    ipcMain.on('new', () => { handleMenu.new().then(); });
    ipcMain.on('change', () => { handleMenu.open(null, true).then(); });
    ipcMain.on('image', (event, image) => { createImageWindow(image); });
    ipcMain.on('mode', () => {
        note.checked = true;
        handleMenu.toTop();
    });
    ipcMain.on('warning', async (event, type) => {
        if (type === 'format') {
            await dialog.showMessageBox(mainWin, {
                    message: 'Encoding Format is not supported!',
                    type: 'warning',
                    buttons: [],
            });
        } else if (type === 'openFile') {
            await dialog.showMessageBox(mainWin, {
                    message: 'Please open a file first',
                    type: 'warning',
                    buttons: [],
            });
        }
    });
    ipcMain.on('cacheBack', (event, number) => { store.set('imgCache', number); });
    mainWin.on('close', async (event) => {
        if (!ifSaved) {
            event.preventDefault();
            const flag = await handleMenu.handleSave();
            if (!flag) {
                ifSaved = true;
                mainWin.close();
            }
        }
    });
    mainWin.on('closed', () => { app.quit(); });
};

const imageListener = (imageWindow) => {
    ipcMain.once('realImage', (e, width, height) => {
        imageWindow.setSize(width, height, false);
        imageWindow.center();
    });
    ipcMain.once('close' + imageWindow.webContents.id, () => imageWindow.close());
}

const shotListener = (shotWindow) => {
    ipcMain.once('finish' + shotWindow.webContents.id, () => {shotWindow.close();});
    ipcMain.once('pin', (e, w, h, x, y) => {
        shotWindow.fullScreen = false;
        shotWindow.resizable = true;
        shotWindow.setSize(w, h, false);
        shotWindow.setPosition(x, y);
        shotWindow.resizable = false;
        preventDragbarContext(shotWindow);
        ifShot = false;
        Menu.setApplicationMenu(menu);
    });

    // 阻止右键菜单
    function preventDragbarContext(win) {
        let WM_INITMENU = 0x116; // 278
        win.hookWindowMessage(WM_INITMENU, function (e) {
        console.log('hook', e);
        win.setEnabled(false);
        setTimeout(() => {
            win.setEnabled(true);
        }, 100);
        return true;
        })
    }
}

// create windows
const createIndexWindow = () => {
    // Create the browser window.
    const indexWindow = new BrowserWindow({
        minWidth: 710,
        minHeight: 610,
        width: 800,
        height: 610,
        show: false,
        backgroundColor: 'rgb(79, 88, 107)',
        icon: path.join(__dirname, 'image/app.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload/pre-index.js'),
        }
    });
    mainWin = indexWindow;

    indexListener(indexWindow);

    // and load the index.html of the app.
    indexWindow.loadFile(path.join(__dirname, 'index.html')).then(() => {
        // if opened before
        let filePath = store.get('filePath');
        if (process.argv.length >= 2) {
            filePath = process.argv[1];
        }
        if (filePath)
            handleMenu.open(filePath).then();
        // send cache number
        let number = store.get('imgCache');
        if (!number) {
            store.set('imgCache', 1);
            number = 1;
        }
        indexWindow.webContents.send('getCache', number);
        indexWindow.webContents.send('path', path.join(path.join(path.dirname(app.getPath('userData')), 'E-note'), 'Local Storage'));
    });

    indexWindow.once('ready-to-show', () => {
        indexWindow.show();
    });

    // indexWindow.webContents.openDevTools();
};

const createImageWindow = (image) => {
    const imageWindow = new BrowserWindow({
        minWidth: 400,
        minHeight: 300,
        maxWidth: 1280,
        maxHeight: 700,
        useContentSize: true,
        show: false,
        backgroundColor: '#F0F0F0',
        icon: path.join(__dirname, 'image/app.png'),
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload/pre-image.js'),
        }
    });

    if (top) {
        imageWindow.setAlwaysOnTop(true);
    }
    imageListener(imageWindow);
    imageWindow.loadFile(path.join(__dirname, 'image.html')).then();
    imageWindow.once('ready-to-show', () => {
        imageWindow.show();
        imageWindow.webContents.send('show', image, imageWindow.webContents.id);
    });
    imageWindow.once('closed', () => {
        ipcMain.removeAllListeners('close');
    });

    // imageWindow.webContents.openDevTools();
}

const createShotWindow = () => {
    Menu.setApplicationMenu(Menu.buildFromTemplate(appMenuFalse));
    const shotWindow = new BrowserWindow({
        useContentSize: true,
        alwaysOnTop: true,
        resizable: false,
        show: false,
        icon: path.join(__dirname, 'image/app.png'),
        backgroundColor: '#00000000',
        transparent: true,
        frame: false,
        thickFrame: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload/pre-shot.js'),
        }
    });
    shotWindow.setSkipTaskbar(true);
    shotWindow.fullScreen = true;

    shotListener(shotWindow);

    shotWindow.loadFile(path.join(__dirname, 'shot.html')).then(() => {
        shotWindow.webContents.send('path', path.dirname(app.getPath('exe')), shotWindow.webContents.id);
        screenshot({format: 'png'}).then((img) => {
            shotWindow.webContents.send('SET_SOURCE', img);
        }).catch((e) => {
            console.log(e);
        });
    });
    shotWindow.once('ready-to-show', () => {
        shotWindow.show();
    });
    shotWindow.once('closed', () => {
        ifShot = false;
        Menu.setApplicationMenu(menu);
        ipcMain.removeAllListeners('finish');
        ipcMain.removeAllListeners('pin');
        if (top) {
            try {
                mainWin.moveTop();
            } catch (e) {}
        }
    });
    // shotWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
    createMenu();
    createIndexWindow();
    globalShortcut.register('CommandOrControl+E', () => {
        handleMenu.handleShot();
    })
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createIndexWindow();
    }
});

app.on('will-quit', () => {
    // Unregister all shortcuts.
    globalShortcut.unregisterAll()
})