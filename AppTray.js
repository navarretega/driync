const { app, Menu, Tray } = require("electron");

// There appears to be a bug whenever you try to quit the app while the developer tools are open
// Sometimes it won't close the app until you close the developer tools

class AppTray extends Tray {
  constructor(icon, mainWindow) {
    super(icon);
    this.setToolTip("driync");
    this.mainWindow = mainWindow;
    this.on("click", this.onClick.bind(this));
    this.on("right-click", this.onRightClick.bind(this));
  }

  onClick() {
    if (this.mainWindow.isVisible() === true) {
      this.mainWindow.hide();
    } else {
      this.mainWindow.show();
    }
  }

  onRightClick() {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Quit",
        click: () => {
          app.isQuitting = true;
          app.quit();
        },
      },
    ]);
    this.popUpContextMenu(contextMenu);
  }
}

module.exports = AppTray;
