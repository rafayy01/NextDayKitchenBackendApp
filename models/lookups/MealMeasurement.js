const mongoose = require("mongoose");



const mealmeasurement = new mongoose.Schema({
    mealmeasurement: {
        type: String,
        required: true,
        unique: true
    },
})

module.exports = mongoose.model("mealmeasurement",mealmeasurement);