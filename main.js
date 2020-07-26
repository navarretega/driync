const { app, shell, BrowserWindow } = require("electron");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 603,
    minWidth: 500,
    minHeight: 603,
    frame: false,
    icon: `${__dirname}/app/assets/icon2.png`,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
    },
  });

  mainWindow.loadFile(`${__dirname}/app/index.html`);

  mainWindow.webContents.on("new-window", function (event, url) {
    event.preventDefault();
    shell.openExternal(url);
  });

  // mainWindow.webContents.openDevTools();

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.on("ready", createWindow);

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", function () {
  if (mainWindow === null) {
    createWindow();
  }
});
