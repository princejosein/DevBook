const express = require("express");
const { application } = require("express");

const app = express();

app.get("/", (req, res) => res.send("API is working"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(`The server up and running on the port ${PORT}`)
);
