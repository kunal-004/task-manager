require("dotenv").config({ path: "../dev.env" });
const express = require("express");
const userRoute = require("./routes/user.routes");
const taskRoute = require("./routes/task.routes");
require("./db/mongoose");

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

//users routes
app.use(userRoute);
//Tasks routes
app.use(taskRoute);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
