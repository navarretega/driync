// ** Imports ** //

const Swal = require("sweetalert2");
const { exec } = require("child_process");

// ** Variables ** //

dialog = remote.dialog;
const folderEle = document.getElementById("folder");
const folderNameEle = document.getElementById("folder-name");
const excludeEle = document.getElementById("exclude-filters");
const syncEle = document.getElementById("sync-minutes");
const formEle = document.getElementById("driync-form");

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
    showAlert(
      "#e16162",
      "warning",
      "Hold on",
      "You need to select a valid directory and how often you want you want to sync!"
    );
    return;
  }

  // Check if rclone is setup
  const rclone_res = await execShellCommand(`rclone about gdrive:`);
  if (rclone_res["err"]) {
    showAlert(
      "#e16162",
      "error",
      "",
      "Make sure rclone is installed, and has a config. name of 'gdrive'!",
      "<a target='_blank' href='https://rclone.org/drive/'>Click here to install</a>"
    );
    return;
  }

  // Save Button was clicked
  if (e.submitter.id === "btn-save") {
    // Test Button was clicked
  } else {
    // Getting directory size
    const size_res = await execShellCommand(`du -sh ${dir} | cut -f1`);
    if (!size_res["err"]) {
      const size = size_res["msg"].trim();
      console.log(size);
    }
  }
}

// ** Event Listeners ** //

folderEle.addEventListener("click", onClickFolder);
formEle.addEventListener("submit", (e) => onSubmitForm(e));
