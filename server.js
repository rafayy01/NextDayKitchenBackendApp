const express=require("express");
const cors=require("cors");
const dotenv=require("dotenv")
require("./db/conn");
const app=express();
//const meals = require("./routes/meals");
const ingredients = require("./routes/ingredients");
const meals = require("./routes/meals");
const mealCategory = require("./routes/lookups/MealCategory");
const clients = require("./routes/clients");
const subscriptions = require("./routes/subscriptions")
const mealMeasurement = require("./routes/lookups/MealMeasurement")
const cookingRounds = require("./routes/cookingRounds")


//middleware
dotenv.config()
app.use(express.json())
app.use(cors())

//routes
app.use("/api/meals/ingredients", ingredients)
app.use("/api/meals", meals)
app.use("/api/clients", clients)
app.use("/api/subscriptions", subscriptions)
app.use("/api/rounds", cookingRounds)

// lookups
app.use("/api/meals/lookups/mealCategory", mealCategory)
app.use("/api/meals/lookups/mealMeasurement", mealMeasurement)




const PORT=process.env.PORT || 8001
app.listen(PORT,()=>{
    console.log("Server Running on Port 8001")
})