const studentData = require("../student-data/students.json");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const sendResponse = require("../utils/response");
const {
  ALLOWED_SEARCH_TERMS,
  FONT_SIZE,
  EMAIL_ID,
} = require("../choices/choices");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const {
  saveFileInDirectory,
  makeDirectory,
  checkFileExistence,
} = require("../utils/fileOperations");

/**
 * Search in JSON Data for a student object with matching condition.
 * @param {*} request
 * @param {*} response
 * @returns Array of all the matching Students.
 */
async function searchStudent(req, res) {
  try {
    const searchQuery = req.query;
    const searchTerm = Object.keys(searchQuery)[0];
    const searchValue = searchQuery[searchTerm];

    if (!searchTerm) {
      sendResponse.sendError(res, "Search query is required!", 400);
      return;
    }

    let matchingStudent;

    switch (searchTerm) {
      case ALLOWED_SEARCH_TERMS.NAME:
        matchingStudent = searchStudentJSON(searchTerm, searchValue);
        break;

      case ALLOWED_SEARCH_TERMS.MAJOR:
        matchingStudent = searchStudentJSON(searchTerm, searchValue);
        break;

      case ALLOWED_SEARCH_TERMS.ZIP:
        matchingStudent = searchStudentJSON(searchTerm, searchValue, "address");
        break;

      case ALLOWED_SEARCH_TERMS.CITY:
        matchingStudent = searchStudentJSON(searchTerm, searchValue, "address");
        break;

      case ALLOWED_SEARCH_TERMS.STATE:
        matchingStudent = searchStudentJSON(searchTerm, searchValue, "address");
        break;
    }
    if (matchingStudent.length === 0) {
      sendResponse.sendError(res, "No matching Student Found", 404);
    } else sendResponse.sendSuccess(res, matchingStudent, 200);
  } catch (error) {
    sendResponse.sendError(res, error.message, 500);
  }
}

function searchStudentJSON(searchTerm, searchValue, nestedKey) {
  const matchingStudents = [];

  for (student of studentData.Students) {
    if (!nestedKey) {
      if (student[searchTerm] == searchValue) {
        matchingStudents.push(student);
      }
    } else {
      for ([key, value] of Object.entries(student[nestedKey])) {
        if (key == searchTerm && value == searchValue) {
          matchingStudents.push(student);
        }
      }
    }
  }

  return matchingStudents;
}

/**
 * Creates PDFs from JSON Data and Saves the files in a folder.
 * @param {*} request
 * @param {*} response
 */
async function createAllPdfs(req, res) {
  try {
    const projectFolder = path.join(__dirname, "../PDF");
    await makeDirectory(projectFolder);
    for (i of studentData.Students) {
      await createForm(i);
    }
    sendResponse.sendSuccess(res, { msg: "✔Created PDFs of Students✔" }, 200);
  } catch (error) {
    sendResponse.sendError(res, "PDF Generation Failed. Try again", 500);
  }
}
async function createForm(objj) {
  try {
    const pdfDoc = await PDFDocument.create();

    const page = pdfDoc.addPage([550, 750]);

    const form = pdfDoc.getForm();

    let yaxis = 650;
    for (const [key, value] of Object.entries(objj)) {
      if (typeof value == "object") {
        for (const [key, val] of Object.entries(value)) {
          page.drawText(`${key.toUpperCase()} : `, {
            x: 50,
            y: yaxis,
            size: FONT_SIZE.text,
          });

          const textField = form.createTextField(`Text-${key}`);
          textField.setText(`${val}`);
          textField.addToPage(page, {
            x: 150,
            y: yaxis,
            height: FONT_SIZE.text,
          });

          yaxis -= 25;
        }
      } else {
        page.drawText(`${key.toUpperCase()} : `, {
          x: 50,
          y: yaxis,
          size: FONT_SIZE.text,
        });

        const textField = form.createTextField(`Text-${key}`);
        textField.setText(`${value}`);
        textField.addToPage(page, {
          x: 150,
          y: yaxis,
          height: FONT_SIZE.text,
        });

        yaxis -= 25;
      }
    }

    const pdfBytes = await pdfDoc.save();
    saveFileInDirectory(pdfBytes, `./PDF/${objj.name}.pdf`);
  } catch (error) {
    throw error;
  }
}

/**
 * Modifies PDF and JSON data with provided Data.
 * @param {*} req
 */
async function checkIfStudentExists(req) {
  try {
    if (!req.body.studentName) throw new Error("provide student name");
    if (req.body.ModifiedStudentData) {
      if (req.body.ModifiedStudentData.name) {
        if (
          searchStudentJSON("name", req.body.ModifiedStudentData.name).length ==
          0
        ) {
          console.log(
            searchStudentJSON("name", req.body.ModifiedStudentData.name)
          );
        } else {
          throw Error("Student already exists");
        }
      }
    } else {
      throw Error("Please provide data for updation");
    }
  } catch (error) {
    throw error;
  }
}
async function modifyPDF(req, res, next) {
  try {
    await checkIfStudentExists(req);
    let pdfPath = `./PDF/${req.body.studentName}.pdf`;
    const uint8Array = fs.readFileSync(pdfPath);

    const pdfDoc = await PDFDocument.load(uint8Array);
    const form = pdfDoc.getForm();
    for ([key, value] of Object.entries(req.body.ModifiedStudentData)) {
      let nameField = form.getTextField(`Text-${key}`);
      nameField.setText(`${value}`);
    }
    const pdfBytes = await pdfDoc.save();

    if (req.body.ModifiedStudentData.name) {
      await fs.promises.rename(
        pdfPath,
        `./PDF/${req.body.ModifiedStudentData.name}.pdf`
      );
      pdfPath = `./PDF/${req.body.ModifiedStudentData.name}.pdf`;
    }
    saveFileInDirectory(pdfBytes, pdfPath);

    next();
  } catch (error) {
    sendResponse.sendError(res, error.message, 500);
  }
}

async function updateJSON(req, res) {
  try {
    const objjIndex = studentData.Students.findIndex(
      (student) => student.name === req.body.studentName
    );
    if (objjIndex === -1) throw Error("Student not Found");
    const objj = studentData.Students[objjIndex];
    if (!objj) throw Error("Student does not Exist");

    for ([key, value] of Object.entries(req.body.ModifiedStudentData)) {
      objj && objj[key] && (objj[key] = value);
      objj && (objj[key] || (objj.address[key] = value));
    }
    await fs.promises.writeFile(
      "./student-data/students.json",
      JSON.stringify(studentData)
    );
    sendResponse.sendSuccess(
      res,
      { msg: " ✔ File Updated Successfully ✔ " },
      200
    );
  } catch (error) {
    sendResponse.sendError(res, error.message, 500);
  }
}

/**
 * Merges PDFs and sends mail to provided E-mail id
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
async function mergePDFs(req, res, next) {
  try {
    const pdfPathArray = req.body.filenames.map((file) => `./PDF/${file}.pdf`);
    await checkFileExistence(pdfPathArray);
    let arrayOfuint8Array = new Array(pdfPathArray.length);
    let donorPdfDoc = new Array(pdfPathArray.length);
    let donorPdfPage = new Array(pdfPathArray.length);

    const pdfDoc = await PDFDocument.create();
    for (let i = 0; i < pdfPathArray.length; i++) {
      arrayOfuint8Array[i] = await fs.promises.readFile(pdfPathArray[i]);
      donorPdfDoc[i] = await PDFDocument.load(arrayOfuint8Array[i]);
      [donorPdfPage[i]] = await pdfDoc.copyPages(donorPdfDoc[i], [0]);
      pdfDoc.addPage(donorPdfPage[i]);
    }
    const pdfBytes = await pdfDoc.save();
    saveFileInDirectory(
      pdfBytes,
      `./PDF/merged-with ${req.body.filenames[0]}.pdf`
    );

    next();
  } catch (error) {
    sendResponse.sendError(res, error.message, 500);
  }
}

async function sendMail(req, res) {
  try {
    let transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: EMAIL_ID.email, // generated ethereal user
        pass: EMAIL_ID.password, // generated ethereal password
      },
    });
    let mailOptions = {
      from: `"${EMAIL_ID.name}" <${EMAIL_ID.email}>`, // sender address
      to: req.body.email, // list of receivers
      subject: "Merged Students Information", // Subject line

      text: `Respected Sir, \nMerged PDF containing Student Data is attached in this mail.\nRegards,\nSagar`, // plain text body
      attachments: [
        {
          path: `./PDF/merged-with ${req.body.filenames[0]}.pdf`,
        },
      ],
    };
    let info = await transporter.sendMail(mailOptions);
    fs.promises.unlink(`./PDF/merged-with ${req.body.filenames[0]}.pdf`);
    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    sendResponse.sendSuccess(
      res,
      { msg: "✔ PDF File Sent Successfully ✔" },
      200
    );
  } catch (error) {
    sendResponse.sendError(res, "Unable to send merged PDF", 500);
  }
}
module.exports = {
  searchStudent,
  createAllPdfs,
  modifyPDF,
  updateJSON,
  mergePDFs,
  sendMail,
};
