/**
 *
 * Basic Actions for React Componenets
 *
 */

const path = require('electron').remote.app.getAppPath()
const isDev = require('electron-is-dev');

/**
 *
 * @param {*} url
 */
export const playStream = url => {
    playVideo(url);

    return {
        type: 'PLAY_STREAM',
        url
    }
}

/**
 *
 * @param {*} offlineUrl
 */
export const playOfflineStream = offlineUrl => {
    playVideo(offlineUrl);

    return {
        type: 'PLAY_OFFLINE_STREAM',
        url: offlineUrl
    }
}

const licenseUrl = 'https://cwip-shaka-proxy.appspot.com/no_auth';

/**
 *
 * @param {*} link
 */
function playVideo(link) {
    const {remote} = require('electron');

    let playerWindow = new remote.BrowserWindow({
        width: 860,
        height: 600,
        show: true,
        resizable: true,
        webPreferences: {
            plugins: true,
            nodeIntegration: true
        }
    });

    // playerWindow.loadURL(isDev ? 'http://localhost:3000/player/index.html' : "");
    playerWindow.loadURL(`file://${path}/build/player/index.html`);
    playerWindow.webContents.openDevTools();
    playerWindow.webContents.on('did-finish-load', function (evt, args) {
        playerWindow.webContents.send('startPlaybackStream', {
            url: link,
            configuration: {
                drm: {
                    servers: {
                        'com.widevine.alpha': licenseUrl
                    }
                }
            },
            offlineSessionId: ''
        });
    });
}
