const { text } = require("express");

const ALLOWED_SEARCH_TERMS = {
  NAME: "name",
  MAJOR: "major",
  ZIP: "zip",
  CITY: "city",
  STATE: "state",
};

const FONT_SIZE = {
  Heading: 20,
  text: 14,
};
const EMAIL_ID = {
  name: "<NAME OF OWNER OF MAIL HERE>",
  email: "<MAIL HERE>",
  password: "<PASSWORD HERE>",
};
module.exports = {
  ALLOWED_SEARCH_TERMS,
  FONT_SIZE,
  EMAIL_ID,
};
