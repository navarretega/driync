const { app, shell, BrowserWindow, ipcMain, Menu } = require("electron");
const Store = require("./Store");
const AppTray = require("./AppTray");

let mainWindow;
let secondaryWindow;
let tray;
const store = new Store({
  configName: "user-settings",
  defaults: {
    settings: {
      folder: "",
      exclude: "",
      syncFrequency: 30,
    },
  },
});

// Main Window
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

  mainWindow.webContents.on("dom-ready", () => {
    mainWindow.webContents.send("settings:get", store.get("settings"));
    // mainWindow.webContents.send("test", store.path);
  });

  // mainWindow.webContents.openDevTools();

  mainWindow.on("close", (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
    return true;
  });

  // Tray
  const icon = `${__dirname}/app/assets/tray_icon.png`;
  tray = new AppTray(icon, mainWindow);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Secondary Window
function createSecondaryWindow() {
  secondaryWindow = new BrowserWindow({
    show: false,
    frame: false,
    icon: `${__dirname}/app/assets/icon2.png`,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
    },
  });

  secondaryWindow.maximize();
  secondaryWindow.loadFile(`${__dirname}/app/secondary.html`);
  secondaryWindow.show();

  secondaryWindow.on("closed", () => {
    secondaryWindow = null;
  });
}

app.on("ready", createWindow);

// Main Window - Set settings
ipcMain.on("settings:set", (e, value) => {
  store.set("settings", value);
  mainWindow.webContents.send("settings:get", store.get("settings"));
});

// Secondary Window - lsjson
ipcMain.on("lsjson:set", (e, value) => {
  createSecondaryWindow();
  secondaryWindow.webContents.on("dom-ready", () => {
    secondaryWindow.webContents.send("lsjson:get", value);
  });
});

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
