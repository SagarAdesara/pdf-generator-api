const fs = require("fs");
async function saveFileInDirectory(pdfBytes, filePath) {
  let writeStream = fs.createWriteStream(filePath);
  writeStream.write(pdfBytes, "base64");
  writeStream.end();

  writeStream.on("finish", () => {
    console.log("saved");
  });
}

async function makeDirectory(projectFolder) {
  try {
    fs.promises.mkdir(projectFolder, { recursive: true });
  } catch (error) {
    throw error;
  }
}

async function checkFileExistence(pdfPathArray) {
  try {
    pdfPathArray.forEach((file) => {
      fs.promises.access(file);
    });
  } catch (error) {
    throw error;
  }
}
module.exports = { saveFileInDirectory, makeDirectory, checkFileExistence };
