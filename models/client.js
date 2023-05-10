const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema({
    clientId: {
        type: Number,
        required: true,
        unique: true
    },
    clientName: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: Number,
        required: true,
        unique: true
    }
   
});


module.exports = mongoose.model("clients",clientSchema);