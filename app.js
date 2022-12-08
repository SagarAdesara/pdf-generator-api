const express = require("express");

const studentRoutes = require("./routes/student.routes");
const { json } = require("express/lib/response");

const app = express();

app.use(express.json());
app.use(studentRoutes);

app.listen(3000, () => {
  console.log("Server is running on port 3000 ✅");
});
