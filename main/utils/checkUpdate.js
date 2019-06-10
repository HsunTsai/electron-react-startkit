const { app, dialog, net } = require('electron');
const fs = require('fs');
const execFile = require('child_process').execFile;
//const package = require(path.resolve(app.getAppPath(), './package.json'));
const { compareVersions } = require('./version');

const restartUpdate = (exePath) => {
    const dialogOpts = {
        type: 'question',
        buttons: ["Yes"],
        title: '應用程式更新',
        message: '新版已經下載完成。 重新啟動應用程式即可更新。'
    }
    dialog.showMessageBox(dialogOpts, (response) => {
        execFile(exePath, function (err, data) {
            if (err) {
                console.error(err);
                return;
            }
            console.log(data.toString());
        });
    })
}

const downloadExe = (item) => {
    //設置文件存放位置，如果用戶沒有設置保存路徑，Electron將使用默認方式來確定保存路徑（通常會提示保存對話框）
    const updateExePath = `${app.getPath('downloads')}/${item.getFilename()}`;
    //console.log('存在', fs.existsSync(updateExePath));
    try {
        item.setSavePath(updateExePath);
        if (updateExePath)
            item.on('updated', (event, state) => {
                if (state === 'interrupted') {
                    console.log('Download is interrupted but can be resumed');
                } else if (state === 'progressing') {
                    if (item.isPaused()) {
                        console.log('Download is paused');
                    } else {
                        console.log(`Received bytes: ${parseInt(item.getReceivedBytes() * 100 / item.getTotalBytes())}`);
                    }
                }
            })
        item.once('done', (event, state) => {
            if (state === 'completed') {
                console.log('Download successfully');
                restartUpdate(updateExePath);
            } else {
                console.log(`Download failed: ${state}`);
            }
            //mainWindow.webContents.send('downstate', state);
        })
    } catch (err) {
        console.error(err)
    }
}
module.exports.downloadExe = downloadExe;

const compareUpdate = (mainWindow, data) => {
    console.log('server_app_version', data.version);
    console.log('current_app_version', app.getVersion());//package.version);
    if (data.version && data.download_link && compareVersions(data.version, app.getVersion()) > 0) {
        const dialogOpts = {
            type: 'question',
            buttons: ["Yes", "Cancel"],
            title: '應用程式更新',
            message: data.note, //process.platform === 'win32' ? releaseNotes : releaseName,
            //detail: '新版已經下載完成。 重新啟動應用程式即可更新。'
        }
        dialog.showMessageBox(dialogOpts, (response) => {
            if (response == 0) {
                const updateExePath = `${app.getPath('downloads')}/${data.download_file_name}`;
                if (fs.existsSync(updateExePath)) {
                    //item.set
                    restartUpdate(updateExePath);
                } else {
                    mainWindow.webContents.downloadURL(data.download_link);
                }
            }
        })
    }
}


const showUpdateMessage = (mainWindow, data) => {
    console.log('server_app_version', data.version);
    console.log('current_app_version', app.getVersion());//package.version);
    if (data.version && data.download_link && compareVersions(data.version, app.getVersion()) > 0) {
        const dialogOpts = {
            type: 'question',
            buttons: ["Yes", "Cancel"],
            title: '應用程式更新',
            message: data.note, //process.platform === 'win32' ? releaseNotes : releaseName,
            //detail: '新版已經下載完成。 重新啟動應用程式即可更新。'
        }
        dialog.showMessageBox(dialogOpts, (response) => {
            if (response == 0) {
                const updateExePath = `${app.getPath('downloads')}/${data.download_file_name}`;
                if (fs.existsSync(updateExePath)) {
                    //item.set
                    restartUpdate(updateExePath);
                } else {
                    mainWindow.webContents.downloadURL(data.download_link);
                }
            }
        })
    }
}

const checkUpdate = (checkUpdateUrl, mainWindow) => {
    const request = net.request({
        method: 'GET',
        url: checkUpdateUrl,
        cache: false
    });
    request.on('response', (response) => {
        if (response.statusCode == 200) {
            response.on('data', (strData) => {
                if (strData) {
                    const data = JSON.parse(strData);
                    showUpdateMessage(mainWindow, data);
                }
            })
        }
    })
    request.end();
}


module.exports.checkUpdate = checkUpdate;
