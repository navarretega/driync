// ** Imports ** //

const { ipcRenderer } = require("electron");
const Swal = require("sweetalert2");
const { exec } = require("child_process");
const path = require("path");

// ** Variables ** //

dialog = remote.dialog;
const folderEle = document.getElementById("folder");
const folderNameEle = document.getElementById("folder-name");
const excludeEle = document.getElementById("exclude-filters");
const syncEle = document.getElementById("sync-minutes");
const formEle = document.getElementById("driync-form");
let isValid = false;

// ** Functions ** //

// Run Shell Commands
function execShellCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
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

  isValid = verifyRCLONE();
  if (!isValid) return;

  if (e.submitter.id === "btn-save") {
    // Save Button was clicked
    saveButton(dir, excludeFilters, syncMinutes);
  } else {
    // Test Button was clicked
    testButton(dir, excludeFilters);
  }
}

// Check if rclone is setup
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
  // Put settings
  ipcRenderer.send("settings:set", {
    folder: dir,
    exclude: excludeFilters,
    syncFrequency: syncMinutes,
  });
  showAlert("#e16162", "success", "Settings saved!", "");
  // clearSaveInterval();
}

// Handle event when the test button is clicked
async function testButton(dir, excludeFilters) {
  let cmd = "rclone lsjson -R";
  if (excludeFilters) {
    excludeFilters.split("\n").map((filter) => {
      if (filter) {
        cmd = `${cmd} --exclude "${filter}"`;
      }
    });
  }
  cmd = `${cmd} "${dir}"`;
  const ls_res = await execShellCommand(cmd);
  if (!ls_res["err"]) {
    ipcRenderer.send("lsjson:set", ls_res["msg"]);
  } else {
    console.log(ls_res["err"]);
  }
}

// Run every X minutes
// const saveInterval = setInterval(() => {
//   console.log("isValid", isValid);
// }, 10000);

// function clearSaveInterval() {
//   clearInterval(saveInterval);
// }

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

  if (folder) isValid = true;

  folderNameEle.value = folder;
  folderNameEle.innerText = folder;
  folderNameEle.setAttribute("title", folder);

  excludeEle.value = exclude;

  syncEle.value = syncFrequency;
});

folderEle.addEventListener("click", onClickFolder);
formEle.addEventListener("submit", (e) => onSubmitForm(e));
