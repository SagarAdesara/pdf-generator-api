const express = require("express");
const studentController = require("../controllers/student.controller");

const router = express.Router();

router.get("/search-student", studentController.searchStudent);

router.post("/create-pdf", studentController.createAllPdfs);

router.post(
  "/modify-pdf",
  studentController.modifyPDF,
  studentController.updateJSON
);

router.post(
  "/merge-email-pdfs",
  studentController.mergePDFs,
  studentController.sendMail
);

module.exports = router;
