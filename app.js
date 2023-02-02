const {app, components, BrowserWindow, ipcMain} = require('electron');
const fs = require('fs');
const path = require('path')

// TESTING PRODUCTION
let index = './index';
if (!fs.existsSync(index)) {
    //DEV
    index = './api/index';
}
let downstreamInstance;
const downstreamElectron = require(index);

let example = 'drm';

const exampleFile = `file://${__dirname}/examples/${example}/index.html`;

// in the main process:
require('@electron/remote/main').initialize()

function createWindow() {

    let appDir = path.dirname(process.mainModule.filename) + '/';

    let useHeadRequest = true;
    downstreamInstance = downstreamElectron.init({
        appDir: appDir,
        numberOfManifestsInParallel: 2,
        useHeadRequests: useHeadRequest,
        noCache: true,
    });

    const mainWindow = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true
        }
    });

    ipcMain.on('set-title', (event, title) => {
        const webContents = event.sender
        const win = BrowserWindow.fromWebContents(webContents)
        win.setTitle(title)
    })

    mainWindow.loadURL(exampleFile);
    mainWindow.webContents.openDevTools()
    require("@electron/remote/main").enable(mainWindow.webContents)
    // mainWindow.loadURL('https://shaka-player-demo.appspot.com/');
}

app.whenReady().then(async () => {
    await components.whenReady();
    console.log('components ready:', components.status());
    createWindow();
});

function onWillQuit() {
    downstreamInstance.stop();
}

//
// app.on('ready', createWindow);
app.on('will-quit', onWillQuit);
app.on('window-all-closed', function () {
    console.log('window-all-closed');
    app.quit();
});