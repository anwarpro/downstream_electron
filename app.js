const electron = require('electron');
const FlakeId = require('flake-idgen');
const remoteMain = require('@electron/remote/main');
const electronRemote = process.type === 'browser'
  ? electron
  : require('@electron/remote');

remoteMain.initialize();

const fs = require('fs');

// TESTING PRODUCTION
let index = './index';
if (!fs.existsSync(index)) {
  //DEV
  index = './api/index';
}
let downstreamInstance;
const downstreamElectron = require(index);

let example = 'main';
process.argv.forEach(function (val, index, array) {
  let params = val.split('=', 2);
  if (!Array.isArray(params) || params.length < 2) {
    return;
  }

  if (params[0] === 'example') {
    example = params[1];
  }
});

const exampleFile = `file://${__dirname}/examples/${example}/index.html`;
const path = require('path');

function createWindow () {
  // eslint-disable-next-line no-process-env
  let appDir = path.dirname(process.mainModule.filename) + '/';
  // head request parameter test
  let useHeadRequest = true;

  // let useHeadRequest = false;
  downstreamInstance = downstreamElectron.init({
    appDir: appDir,
    numberOfManifestsInParallel: 2,
    useHeadRequests: useHeadRequest
  });

  const win = new electronRemote.BrowserWindow({
    width: 1200,
    height: 700,
    resizable: true,
    webPreferences: {
      plugins: true,
      nodeIntegration: true,
      contextIsolation: false,
      // NOTE: !WARNING! use with caution it allows app to download content
      //                 from any URL
      webSecurity: false
    }
  });

  remoteMain.enable(win.webContents);
  win.loadURL(exampleFile);
  win.webContents.openDevTools();
}

function onWillQuit() {
  downstreamInstance.stop();
}

electronRemote.app.on('ready', createWindow);
electronRemote.app.on('will-quit', onWillQuit);
electronRemote.app.on('window-all-closed', function () {
  console.log('window-all-closed');
  electronRemote.app.quit();
});

electronRemote.app.on('widevine-ready', (version, lastVersion) => {
  if (null !== lastVersion) {
    console.log('Widevine ' + version + ', upgraded from ' + lastVersion + ', is ready to be used!');
  } else {
    console.log('Widevine ' + version + ' is ready to be used!');
  }
});

electronRemote.app.on('widevine-update-pending', (currentVersion, pendingVersion) => {
  console.log('Widevine ' + currentVersion + ' is ready to be upgraded to ' + pendingVersion + '!');
});

electronRemote.app.on('widevine-error', (error) => {
  console.log('Widevine installation encounterted an error: ' + error);
  process.exit(1)
});
