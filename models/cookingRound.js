const mongoose = require("mongoose");

 const plannedIngredientsSchema = new mongoose.Schema({
    ingredientName: {
        type: String,
        required: true
    },
    totalIngredientWeight: {
        type: Number,
        required: true
    }
  });

  const actualIngredientsSchema = new mongoose.Schema({
    ingredientName: {
        type: String,
        required: true,
        unique: true
    },
    totalIngredientWeight: {
        type: Number,
        required: true
    }
  });

  const clientsSchema = new mongoose.Schema({
    clientId: {
        type: Number,
        required: true,
        unique: false
    },
    date: {
      type: Date,
      required: true
    },
    uncookedPlannedPortion: {
        type: Number,
        required: true
    },
    cookedWeight: {
        type: Number,
        required: false
    },
    boxNumber: {
      type: Number,
      required: true
    }
  });

  const mealSettingSchema = new mongoose.Schema({
    categoryName: {
      type: String,
      required: false
  },
  mealId:{
    type: String,
    required:true
  }, 
  plannedIngredients: [plannedIngredientsSchema],
  actualIngredients: [actualIngredientsSchema],
  cookedTotalWeight: {
    type: Number,
    required:false
  },
  clients:[clientsSchema]
  });

const cookingRoundSchema = new mongoose.Schema({
  roundId: {
      type: Number,
      required: true
  },
  startDate: {
      type: Date,
      required: true
  },
  endDate: {
    type: Date,
    required: true
},
  mealSettings:[mealSettingSchema]
});



module.exports = mongoose.model("cookingRound", cookingRoundSchema);
