// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, session, net } = require('electron');
const path = require('path');
const url = require('url');
const isOnline = require('is-Online'); //這個套件是自己npm的 在打包electron時，需複製進打包專案中(詳情建package.json package_step_4)
const { checkUpdate, downloadExe } = require(path.resolve(app.getAppPath(), './main/utils/checkUpdate'));
const { isDev } = require(path.resolve(app.getAppPath(), './main/utils/environment'));

//C:\Users\HSUN.TSAI.DELTA\AppData\Roaming\npm\grunt

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
function createWindow() {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		width: 1600,
		height: 900,
		webPreferences: {
			nodeIntegration: true
		}
	})

	// and load the index.html of the app.
	if (isDev) {
		mainWindow.loadURL('http://localhost:9999/');
		// Open the DevTools
		mainWindow.webContents.openDevTools({ mode: "right" });
		isDevToolOpen = true;
	} else {
		mainWindow.setMenu(null);
		mainWindow.loadURL(url.format({
			pathname: path.join(__dirname, './index.html'),
			protocol: 'file:',
			slashes: true
		}))
	}

	// Emitted when the window is closed.
	mainWindow.on('closed', function () {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null
	})

	// send message to react or receive message from react
	ipcMain.on('asynchronous-react-message', (event, arg) => {
		const caseName = arg && arg.case;
		if (caseName) {
			console.log('react-message', caseName);
			switch (caseName) {
				//開啟開發者套件
				case 'openDevTool':
					if (isDevToolOpen) {
						mainWindow.webContents.closeDevTools();
					} else {
						mainWindow.webContents.openDevTools({ mode: "right" });
					}
					isDevToolOpen = !isDevToolOpen;
					break;
				//開啟新頁瀏覽HTML
				case 'openWebPreview':
					new BrowserWindow({
						width: 800,
						height: 600,
						webPreferences: {
							nodeIntegration: true
						}
					}).loadURL('data:text/html;charset=utf-8,' + arg.data);
					break;
				//取得目前網路狀態
				case 'getOnlineStatus':
					(async () => {
						const onlineStatus = await isOnline();
						if (networkAvailable !== onlineStatus) {
							networkAvailable = onlineStatus;
							event.sender.send('onlineStatusChange', onlineStatus);
						}
					})();
					break;
				//檢查更新
				case 'checkUpdate':
					checkUpdate('http://www.hsunserver.ga/download/update.json', mainWindow);
					break;
				//測試通知BOX
				case 'showNotificationBox':
					event.sender.send('asynchronous-electron-message', { type: 'onShowNotificationBox' });
					break;
				default:
					event.sender.send('asynchronous-electron-message', arg);
			}
		}
	});

	// 設置更新時的下載exe監聽
	mainWindow.webContents.session.on('will-download', (event, item, webContents) => {
		//item.
		downloadExe(item);
	});


}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) createWindow()
})

app.commandLine.appendSwitch("--disable-http-cache");

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

//grunt 生出桌面快捷
var handleStartupEvent = function () {
	if (process.platform !== 'win32') {
		return false;
	}

	var squirrelCommand = process.argv[1];

	switch (squirrelCommand) {
		case '--squirrel-install':
		case '--squirrel-updated':
			install();
			return true;
		case '--squirrel-uninstall':
			uninstall();
			app.quit();
			return true;
		case '--squirrel-obsolete':
			app.quit();
			return true;
	}
	// 安裝
	function install() {
		var cp = require('child_process');
		var updateDotExe = path.resolve(path.dirname(process.execPath), '..', 'update.exe');
		var target = path.basename(process.execPath);
		var child = cp.spawn(updateDotExe, ["--createShortcut", target], { detached: true });
		child.on('close', function (code) {
			app.quit();
		});
	}
	// 卸載
	function uninstall() {
		var cp = require('child_process');
		var updateDotExe = path.resolve(path.dirname(process.execPath), '..', 'update.exe');
		var target = path.basename(process.execPath);
		var child = cp.spawn(updateDotExe, ["--removeShortcut", target], { detached: true });
		child.on('close', function (code) {
			app.quit();
		});
	}

};

if (handleStartupEvent()) {
	return;
}