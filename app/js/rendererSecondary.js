const { ipcRenderer } = require("electron");
const fs = require("fs");

const tbodyEle = document.getElementById("tbody");
const totalLengthEle = document.getElementById("total-length");
const totalSizeEle = document.getElementById("total-size");
const fileInfo = document.getElementById("file-info-path");

function compare(a, b) {
  const pathA = a["Path"].toUpperCase();
  const pathB = b["Path"].toUpperCase();

  let comparison = 0;
  if (pathA > pathB) {
    comparison = 1;
  } else if (pathA < pathB) {
    comparison = -1;
  }
  return comparison;
}

function formatBytes(bytes, decimals) {
  if (bytes == 0) return "0 Bytes";
  if (bytes == -1) return "~";
  let k = 1024,
    dm = decimals || 2,
    sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
    i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

ipcRenderer.on("lsjson:get", (e, filePath) => {
  let totalSize = 0;
  const values = fs.readFileSync(filePath, { encoding: "utf8", flag: "r" });
  data = JSON.parse(values);
  data.sort(compare);
  let rows = "";
  data.map((d) => (totalSize += d["Size"]));
  data.slice(0, 500).map((d) => {
    rows +=
      "<tr>" +
      "<td>" +
      d["Path"] +
      "</td>" +
      "<td>" +
      formatBytes(d["Size"]) +
      "</td>" +
      "<td>" +
      (d["IsDir"] ? "Yes" : "No") +
      "</td>" +
      "</tr>";
  });
  totalSize = formatBytes(totalSize);
  totalLengthEle.innerText = `Total number of files: ${data.length}`;
  totalSizeEle.innerText = `Total size: ${totalSize}`;
  tbodyEle.innerHTML = rows;
  if (data.length > 500) {
    fileInfo.innerText = `Showing the first 500 rows. If you want to see all of them, please check the following file: ${filePath}`;
  }
});
