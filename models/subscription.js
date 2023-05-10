const mongoose = require("mongoose");


// const mealSettingSchema = new mongoose.Schema({
// mealId:{
//   type: String,
//   required:true
// }, 
// mealPortion: {
//   type: Number,
//   required:true
// },
// boxNumber: {
//   type: Number,
//   required:true
// },
// // cookedTotalWeight: {
// //   type: Number,
// //   required:false
// // }
// });

const mealCategory = new mongoose.Schema({
  categoryName: {
      type: String,
      required: true,
      unique: false
  },
  // selectedMealId: {
  //     type: String,
  //     required: false
  // },
  // boxNumber: {
  //   type: Number,
  //   required: false
  // },
  // mealPortion: {
  //   type:Number,
  //   required:false
  // }
})

const subscriptionSchema = new mongoose.Schema({
  clientId: {
    type: Number,
    required: true,
  },
  targetProtien: {
    type: Number,
    required: true
  },
  targetCalories: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  categories: [mealCategory]
});

module.exports = mongoose.model("subscription", subscriptionSchema);
