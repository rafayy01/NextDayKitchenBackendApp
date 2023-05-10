const mongoose = require("mongoose");
const _ = require("underscore")


const ingredientsSchema = new mongoose.Schema({
    ingredientName: {
        type: String,
        required: true,
        unique: true
    },
    ingredientWeight: {
        type: String,
        required: true
    },
    ingredientCategory: {
        type: String,
        required: false
    }
});
//Meal Schema
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
    }, 
    ingredients:[ingredientsSchema]
});


// mealSchema.pre('save', function (next) {
//     this.ingredients = _.uniq(this.ingredients);
//     next();
//   });

module.exports = mongoose.model("meals",mealSchema);