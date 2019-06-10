var grunt = require('grunt');

grunt.config.init({
    pkg: grunt.file.readJSON('package.json'),
    'create-windows-installer': {
        x64: {
            /* 安裝檔版本 */
            version: '1.0.0',
            /* 作者 */
            authors: 'Hsun Tsai',
            /* 在應用程式與功能之圖示 */
            // iconUrl: 'http://www.icons101.com/icon_ico/id_36436/Mushroom__1UP.ico',
            /* 執行檔位置 */
            appDirectory: './ReleaseApp-win32-x64',
            /* 打包匯出路徑 */
            // outputDirectory: './Setup',
            /* exe名稱 */
            exe: 'ReleaseApp.exe',
            /* 描述 */
            description: 'My Electron App',
            /* 安裝檔圖示 */
            setupIcon: "../icons/favicon.ico",
            /* 不要產生Msi檔 */
            noMsi: true
        }
    }
});

/* 加載任務 */
grunt.loadNpmTasks('grunt-electron-installer');
/* 設置為默認 */
grunt.registerTask('default', ['create-windows-installer']);