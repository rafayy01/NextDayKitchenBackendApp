const mongoose = require("mongoose");

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

const MealModalType1 = new mongoose.Schema({
  mealCategory: {
    type: String,
    required: false,
  },
  mealName: {
    type: String,
    required: false,
  },
  mealDesciption: {
    type: String,
    required: false,
  },
  measurementUnit: {
    type: String,
    required: false,
  },
  mealDesciption: {
    type: String,
    required: false,
  },
  minServing: {
    type: Number,
    required: false,
  },
  incrementPortion: {
    type: Number,
    required: false,
  },
  maxserving: {
    type: Number,
    required: false,
  },
  minservingCarbs: {
    type: Number,
    required: false,
  },
  minservingfat: {
    type: Number,
    required: false,
  },
  minservingprotein: {
    type: Number,
    required: false,
  },
  boxNumber: {
    type: Number,
    required: false,
  },
  carbs: {
    type: Array,
    required: false,
  },
  ingredients: [ingredientsSchema]
});

module.exports = mongoose.model("mealstype1", MealModalType1);
