const mongoose = require("mongoose");

const mealSchema = new mongoose.Schema({
    mealName: {
        type: String,
        required: true,
        unique: true
    },
    mealDesc: {
        type: String,
        required: false
    },
    mealType: {
        type: String,
        required: false
    }
});

module.exports = mongoose.model("meals",mealSchema);