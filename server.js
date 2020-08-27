const express = require("express");
const { application } = require("express");
const connectDB = require("./config/db");

const app = express();

//Init middleware
app.use(express.json({ extended: false }));
//Connect to mongo db
connectDB();

app.use("/api/users", require("./routes/api/users"));
app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/profile", require("./routes/api/profile"));
app.use("/api/posts", require("./routes/api/posts"));

app.get("/", (req, res) => res.send("API is working"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(`The server up and running on the port ${PORT}`)
);
