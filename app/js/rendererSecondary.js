const { ipcRenderer } = require("electron");

const tbodyEle = document.getElementById("tbody");
const totalSizeEle = document.getElementById("total-size");

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

// tbodyEle.innerHTML =
//   "<tr>" + "<td>" + "/app/myapp/home" + "</td>" + "<td>" + "345655" + "</td>" + "</tr>";

ipcRenderer.on("lsjson:get", (e, values) => {
  let totalSize = 0;
  data = JSON.parse(values);
  data.sort(compare);
  let rows = "";
  data.map((d) => {
    totalSize += d["Size"];
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
  totalSizeEle.innerText = `Total size: ${totalSize}`;
  tbodyEle.innerHTML = rows;
});
