/**
 * The preload script runs before. It has access to web APIs
 * as well as Electron's renderer process modules and some
 * polyfilled Node.js functions.
 *
 * https://www.electronjs.org/docs/latest/tutorial/sandbox
 */


const {contextBridge, ipcRenderer} = require('electron')
const fs = require("fs");
const persistentConfig = {};
const videoType = 'video/mp4;codecs="avc1.42c01e"';
const audioType = 'audio/mp4;codecs="mp4a.40.2"';

let manifestId;

// TESTING PRODUCTION
let index = './index';
if (!fs.existsSync(index)) {
    //DEV
    index = './api/index';
}

function FakePersistentPlugin() {
    this.createPersistentSession = function (persistentConfig) {
        console.log('create - persistent plugin', persistentConfig);
        return new Promise(function (resolve) {
            resolve(null)
            // _createOrLoadMediaSession(function(sessionId) {
            //   //activeSession.close();
            //   resolve(sessionId);
            // }, persistentConfig.pssh, null);
        });
    };

    this.removePersistentSession = function (sessionId) {
        return new Promise(function (resolve) {
            console.log('remove - persistent plugin, sessionId', sessionId);
            resolve();
        });
    };
}

const downstreamElectron = require(index).init(window, new FakePersistentPlugin());

function onDownloadProgress(err, stats) {
    console.log(stats, err);
}

function onDownloadFinish(err, info) {
    console.log(info, err);

    $('#mainActions').append($('</br>'));
    $('#mainActions').append($('<input id="offline" style="margin-right: 5px" type="button" value="Play Offline">').on('click', function () {
        videoPath = info.manifest.files[0].localUrl;
        audioPath = info.manifest.files[1].localUrl;

        var ms = new MediaSource;
        var video = document.querySelector('#videoOffline');

        ms.addEventListener('sourceopen', function () {
            console.log('sourceopen');

            var videoSourceBuffer = ms.addSourceBuffer(videoType);
            videoSourceBuffer.appendBuffer(fs.readFileSync(videoPath).buffer);

            var audioSourceBuffer = ms.addSourceBuffer(audioType);
            audioSourceBuffer.appendBuffer(fs.readFileSync(audioPath).buffer);

            downstreamElectron.downloads.getOfflineLink(manifestId).then(function (result) {
                console.log(result);

                if (activeSession !== null) {
                    var video = document.querySelector('#videoOffline');
                    video.play();
                } else {
                    _createOrLoadMediaSession(function (sessionId) {
                        var video = document.querySelector('#videoOffline');
                        video.play();
                    }, null, result.persistent);
                }

            }, function (err) {
                console.log('play offline error', err);
            });
        });
        video.src = URL.createObjectURL(ms);
    }));

    $('#mainActions').append($('<input id="remove" style="margin-right: 5px" type="button" value="Remove">').on('click', function () {
        if (confirm('Do you really want to delete this download? - this cannot be undone')) {
            downstreamElectron.downloads.remove(manifestId).then(function () {
                removeUI();
                console.log('removed');
            }, function (err) {
                console.log('remove error', err);
            });
        }
    }));

    $('#mainActions').append($('<input id="removeAll" type="button" value="Remove All">').on('click', function () {
        if (confirm('Do you really want to remove all downloads? - this cannot be undone')) {
            downstreamElectron.downloads.removeAll().then(function () {
                removeUI();
                console.log('removed');
            }, function (err) {
                console.log('remove all error', err);
            });
        }
    }));

    $('#videoOffline').removeAttr('hidden');
}

function removeUI() {
    $('#videoOffline').attr('hidden', true);
    $('#play').remove();
    $('#remove').remove();
    $('#removeAll').remove();
    $('#offline').remove();

    var video = document.querySelector('#videoOffline');
    video.pause();
}

contextBridge.exposeInMainWorld('electronAPI', {
    setTitle: (title) => ipcRenderer.send('set-title', title),
    create: (url) => {
        downstreamElectron.downloads.create(url, '').then(function (result) {
            console.log(result);
            manifestId = result.id;

            let representations = {
                video: [result.video[0].id],
                audio: [result.audio[0].id]
            };
            console.log(representations);

            downstreamElectron.downloads.createPersistent(result.id, persistentConfig).then(function (persistentSessionId) {
                console.log('persistent', persistentSessionId);
            }, function (err) {
                console.log('persistent error', err);
            });


            downstreamElectron.downloads.start(result.id, representations).then(function () {

                downstreamElectron.downloads.subscribe(result.id, 1000, onDownloadProgress, onDownloadFinish).then(function () {
                    console.log('subscribed');
                }, function (err) {
                    console.log('subscribed', err);
                });
            }, function (err) {
                console.log(result, err);
            });
        }, function (err) {
            console.log(err);
        })
    }
})

window.addEventListener('DOMContentLoaded', () => {
    window.$ = window.jQuery = require('jquery');
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector)
        if (element) element.innerText = text
    }

    for (const type of ['chrome', 'node', 'electron']) {
        replaceText(`${type}-version`, process.versions[type])
    }

    downstreamElectron.downloads.getListWithInfo().then(function (results) {
        console.log(results);

        for (let index = 0; index < results.length; ++index) {
            let result = results[index];
            if (result.status !== 'FINISHED') {
                continue;
            }
        }
    }, function (err) {
        console.log(err);
    });

})
