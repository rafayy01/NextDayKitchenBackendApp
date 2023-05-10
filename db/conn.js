const mongoose = require("mongoose");
const url = "mongodb://localhost:27017/NextdayFoodKitchen"
// const DB = process.env.DATABASE

const DB = "mongodb://127.0.0.1:27017/NextdayFoodKitchen";
console.log("Starting trying to connect to DB...")
mongoose
  .connect(DB)
  .then(() => console.log("connection start"))
  .catch((error) => console.log(error.message));
