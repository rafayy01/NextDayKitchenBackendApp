const mongoose = require("mongoose");



const mealCategory = new mongoose.Schema({
    categoryName: {
        type: String,
        required: true,
        unique: true
    },
})

module.exports = mongoose.model("mealCategory",mealCategory);