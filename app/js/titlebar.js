const remote = require("electron").remote;

const win = remote.getCurrentWindow();

document.onreadystatechange = (event) => {
  if (document.readyState == "complete") {
    handleWindowControls();
  }
};

window.onbeforeunload = (event) => {
  win.removeAllListeners();
};

function handleWindowControls() {
  document.getElementById("tb-min-button").addEventListener("click", (event) => {
    win.minimize();
  });

  document.getElementById("tb-max-button").addEventListener("click", (event) => {
    win.maximize();
  });

  document.getElementById("tb-restore-button").addEventListener("click", (event) => {
    win.unmaximize();
  });

  document.getElementById("tb-close-button").addEventListener("click", (event) => {
    win.close();
  });

  toggleMaxRestoreButtons();
  win.on("maximize", toggleMaxRestoreButtons);
  win.on("unmaximize", toggleMaxRestoreButtons);

  function toggleMaxRestoreButtons() {
    if (win.isMaximized()) {
      document.body.classList.add("tb-maximized");
    } else {
      document.body.classList.remove("tb-maximized");
    }
  }
}

// Custom Scrollbar
// To get rid of it, simply remove the next line,
// and remove the css (simplebar.css) and js (simblebar.min.js)
new SimpleBar(document.getElementById("main"));
