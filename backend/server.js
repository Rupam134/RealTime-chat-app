const express = require("express");
const path = require("path");

const messageRoutes = require("./routes/messageRoutes");

const app = express();
const PORT = 3001;

app.use(express.json());
app.use("/api", messageRoutes);


app.use(express.static(path.join(__dirname, "..", "frontend")));

app.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
});