// ** Imports ** //

const electron = require("electron");
const { ipcRenderer } = require("electron");
const Swal = require("sweetalert2");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

// ** Variables ** //

dialog = remote.dialog;
const folderEle = document.getElementById("folder");
const folderNameEle = document.getElementById("folder-name");
const excludeEle = document.getElementById("exclude-filters");
const syncEle = document.getElementById("sync-minutes");
const formEle = document.getElementById("driync-form");
const btnSave = document.getElementById("btn-save");
const btnTest = document.getElementById("btn-test");
const userDataPath = (electron.app || electron.remote.app).getPath("userData");
let saveInterval;
let isRunning = false;

// ** Functions ** //

// Run Shell Commands
function execShellCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { maxBuffer: 1024 * 1024 * 5 }, (error, stdout, stderr) => {
      if (error) {
        resolve({ err: true, msg: error.message });
      }
      resolve({ err: false, msg: stdout ? stdout : stderr });
    });
  });
}

// Add Folder Name
function onClickFolder() {
  let options = { properties: ["openDirectory"] };
  dialog
    .showOpenDialog(null, options)
    .then((res) => {
      if (res.canceled) return;
      const dir = res.filePaths[0];
      folderNameEle.value = dir;
      folderNameEle.innerText = dir;
      folderNameEle.setAttribute("title", dir);
    })
    .catch((e) => {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong! Please try again.",
      });
    });
}

// Display Alert Box
function showAlert(confirmButtonColor, icon, title, text, footer = "") {
  Swal.fire({
    width: "70%",
    padding: ".80rem",
    heightAuto: false,
    confirmButtonColor: confirmButtonColor,
    icon: icon,
    title: title,
    text: text,
    footer: footer,
  });
}

//Handle Form Submit
async function onSubmitForm(e) {
  e.preventDefault();

  const dir = folderNameEle.value;
  const excludeFilters = excludeEle.value;
  const syncMinutes = syncEle.value;

  if (!dir || !syncMinutes) {
    showAlert("#e16162", "warning", "Hold on", "You need to select a valid directory!");
    return;
  }

  if (!verifyRCLONE()) return;

  if (e.submitter.id === "btn-save") {
    // Save Button was clicked
    saveButton(dir, excludeFilters, syncMinutes);
  } else {
    // Test Button was clicked
    testButton(dir, excludeFilters);
  }
}

// Check if rclone is setup
// TODO - Dynamically let user assign rclone config name
async function verifyRCLONE() {
  const rclone_res = await execShellCommand(`rclone about gdrive:`);
  if (rclone_res["err"]) {
    showAlert(
      "#e16162",
      "error",
      "",
      "Make sure rclone is installed, and has a config. name of 'gdrive'!",
      "<a target='_blank' href='https://rclone.org/drive/'>Click here to install</a>"
    );
    return false;
  }
  return true;
}

// Handle event when the save button is clicked
function saveButton(dir, excludeFilters, syncMinutes) {
  btnSave.classList.add("is-loading");
  // Put settings
  ipcRenderer.send("settings:set", {
    folder: dir,
    exclude: excludeFilters,
    syncFrequency: syncMinutes,
  });
  showAlert("#e16162", "success", "Settings saved!", "");
  setCustomInterval(dir, excludeFilters, syncMinutes);
  btnSave.classList.remove("is-loading");
}

// Handle event when the test button is clicked
async function testButton(dir, excludeFilters) {
  btnTest.classList.add("is-loading");
  let cmd = "rclone lsjson -R";
  if (excludeFilters) {
    excludeFilters.split("\n").map((filter) => {
      if (filter) {
        cmd = `${cmd} --exclude "${filter}"`;
      }
    });
  }
  cmd = `${cmd} "${dir}"`;
  // Adding output to file instead of stdout to prevent maxBuffer errors
  const filePath = path.join(userDataPath, "driync.files.txt");
  cmd = `${cmd} > ${filePath}`;
  const ls_res = await execShellCommand(cmd);
  if (!ls_res["err"]) {
    ipcRenderer.send("lsjson:set", filePath);
  } else {
    // console.log(ls_res["msg"]);
    showAlert("#e16162", "info", "Sorry", "There was an error.");
  }
  btnTest.classList.remove("is-loading");
}

// Set interval
function setCustomInterval(dir, excludeFilters, syncMinutes) {
  const duration = parseInt(syncMinutes) * 60000;
  if (saveInterval) {
    clearInterval(saveInterval);
  }
  saveInterval = setInterval(() => {
    if (isRunning) {
      console.log("Sync already running");
    } else {
      console.log("Syncing...");
      sync(dir, excludeFilters);
    }
  }, duration);
}

async function sync(dir, excludeFilters) {
  isRunning = true;
  let cmd = "rclone sync -v";
  if (excludeFilters) {
    excludeFilters.split("\n").map((filter) => {
      if (filter) {
        cmd = `${cmd} --exclude "${filter}"`;
      }
    });
  }
  cmd = `${cmd} "${dir}" "gdrive:"`;
  // stderr
  const filePath = path.join(userDataPath, "driync.log");
  cmd = `${cmd} 2> "${filePath}"`;
  // Exec command
  const sync_res = await execShellCommand(cmd);
  let notificationTitle;
  if (!sync_res["err"]) {
    notificationTitle = "Syncing successfully completed!";
  } else {
    notificationTitle = "Error while syncing!";
  }
  notify(notificationTitle, `For more details, see here: ${filePath}`);
  isRunning = false;
}

// Send dektops notifications
function notify(title, body) {
  new Notification(title, {
    body: body,
    icon: path.resolve("./app/assets/icon2.png"),
  });
}

// ** Event Listeners ** //

// Get settings
ipcRenderer.on("settings:get", (e, settings) => {
  const { folder, exclude, syncFrequency } = settings;

  if (folder) {
    setCustomInterval(folder, exclude, syncFrequency);
  }

  folderNameEle.value = folder;
  folderNameEle.innerText = folder;
  folderNameEle.setAttribute("title", folder);

  excludeEle.value = exclude;

  syncEle.value = syncFrequency;
});

folderEle.addEventListener("click", onClickFolder);
formEle.addEventListener("submit", (e) => onSubmitForm(e));
