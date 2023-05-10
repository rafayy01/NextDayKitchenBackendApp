const router = require("express").Router();
const Round = require("../models/cookingRound");
const Clients = require("../models/client");
const Subscriptions = require("../models/subscription");
const Meal = require("../models/meal");
//import removeArrayItem from 'remove-array-item'
const removeFromArray = require("remove-from-array");
const { request } = require("express");

// // get with mongoose _id
// router.get("/:id", async (req, res) => {
//   try {
//     const cookingRoundId = req.params.id;
//     const cookingRound = await Rounds.findById({ _id: cookingRoundId });

//     res.status(201).json(cookingRound);
//   } catch (error) {
//     res.status(422).json(error);
//   }
// });

// // get rounds based on Id
// router.get("/:roundId", async (req, res) => {
//   try {
//     const cookingRoundId = req.params.roundId;
//     const cookingRound = await Rounds.find({ roundId: cookingRoundId });

//     res.status(201).json(cookingRound);
//   } catch (error) {
//     res.status(422).json(error);
//   }
// });

// update round data
router.patch("/editRound/:id", async (req, res) => {
  try {
    const updatedRound = await Round.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );

    res.status(201).json(updatedRound);
  } catch (error) {
    res.status(422).json(error);
  }
});
// send dates and retrieves list of clients and categories required.
router.post("/getprerounddata", async (req, res) => {
  console.log(req.body);
  try {
    const { startDate, endDate } = req.body;
    //from to
    const subs = await Subscriptions.find({
      date: { $gte: startDate, $lte: endDate },
    });

    let returnData = Object();
    returnData.newRoundId = await getCookingRoundId();
    returnData.subs = subs;

    //here need to also send the next new round ID
    res.status(201).json(returnData);
  } catch (error) {
    console.log("testing");
    res.status(422).json(error);
  }
});

function setDefaultPortion(mealSetting, mealData) {
  mealSetting.mealServing = mealData.minServing;
  mealSetting.mealP = mealData.minservingprotein;
  mealSetting.mealF = mealData.minservingfat;
  mealSetting.mealC = mealData.minservingCarbs;
  mealSetting.mealData = mealData;
  return mealSetting;
}

function getBreakfastMeal(mealsData) {
  for (i in mealsData) {
    if (mealsData[i].mealCategory == "Breakfast") {
      return mealsData[i];
    }
  }
}

function getCarb(mealsData, mealsPlan, breakfastMeal) {
  const breakfastCarbsIds = breakfastMeal.carbs.map((item) => {
    return item.id;
  });

  const carbMealId = mealsPlan.filter(
    (element) =>
      breakfastCarbsIds.includes(element.mealId) &&
      mealsPlan.filter((item) => item.mealId == breakfastMeal._id)[0]
        .boxNumber == element.boxNumber
  )[0].mealId;

  for (num in mealsData) {
    if (mealsData[num]._id == carbMealId) {
      return mealsData[num];
    }
  }

  return breakfastMeal;
}

function increasePortion(mealSetting) {
  mealSetting.mealServing += mealSetting.mealData.incrementPortion;
  mealSetting.mealP =
    (mealSetting.mealServing / mealSetting.mealData.minServing) *
    mealSetting.mealData.minservingprotein;
  mealSetting.mealF =
    (mealSetting.mealServing / mealSetting.mealData.minServing) *
    mealSetting.mealData.minservingfat;
  mealSetting.mealC =
    (mealSetting.mealServing / mealSetting.mealData.minServing) *
    mealSetting.mealData.minservingCarbs;
  return mealSetting;
}

function getAddonsInBox(mealPlan, boxNumber, cat) {
  let optMeals = [];

  mealPlan.forEach((item) => {
    if (
      !item.mealCategory.includes(cat) &&
      !item.mealCategory.includes("carb") &&
      item.boxNumber == boxNumber
    ) {
      optMeals.push(item);
    }
  });
  return optMeals;
}

function getBoxNumber(mealsPlan, category) {
  for (num in mealsPlan) {
    if (mealsPlan[num].mealCategory.includes(category)) {
      return mealsPlan[num].boxNumber;
    }
  }
}

function getMeal(mealId, mealsData) {
  for (num in mealsData) {
    if (mealsData[num]._id == mealId) {
      return mealsData[num];
    }
  }
}

function isEmpty(obj) {
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) return false;
  }
  return true;
}

function getCurrentCalories(meal) {
  if (!isEmpty(meal)) {
    return (meal.mealC + meal.mealP) * 4 + meal.mealF * 9;
  }
  return 0;
}

function getTotalMinCalories(data) {
  let totalCal = 0;
  if (data) {
    if (Array.isArray(data)) {
      data.forEach((item) => {
        totalCal +=
          (item.minservingCarbs + item.minservingprotein) * 4 +
          item.minservingfat * 9;
      });
    } else {
      totalCal +=
        (data.minservingCarbs + data.minservingprotein) * 4 +
        data.minservingfat * 9;
    }
  }
  return totalCal;
}

function afterIncremeantCal(mealSetting) {
  let clone = new Object();
  if (!isEmpty(mealSetting)) {
    clone.mealServing =
      mealSetting.mealData.incrementPortion + mealSetting.mealServing;
    clone.mealP =
      (clone.mealServing / mealSetting.mealData.minServing) *
      mealSetting.mealData.minservingprotein;
    clone.mealF =
      (clone.mealServing / mealSetting.mealData.minServing) *
      mealSetting.mealData.minservingfat;
    clone.mealC =
      (clone.mealServing / mealSetting.mealData.minServing) *
      mealSetting.mealData.minservingCarbs;
  }
  return getCurrentCalories(clone);
}

function breakfastController(
  sub,
  mainMeal,
  carbMealSetting,
  optionalAddOns,
  bp
) {
  let mainCal = getCurrentCalories(mainMeal);
  let carbCal = getCurrentCalories(carbMealSetting);
  let addonsCal = getTotalMinCalories(optionalAddOns);
  let totalConsumedCal = mainCal + carbCal + addonsCal;

  //    TESTING CODE
  //  console.log("calories targeted: " + (sub.targetCalories*bp) + " current total: " + totalConsumedCal )
  // console.log("if increase main: " + (afterIncremeantCal(mainMeal)+carbCal+addonsCal))
  // console.log("if increase crb: " + (afterIncremeantCal(carbMealSetting)+mainCal+addonsCal))

  // console.log("if 1 : " + ((afterIncremeantCal(mainMeal)+carbCal+addonsCal) < (sub.targetCalories*bp)))
  // console.log("if 2 : " + ((afterIncremeantCal(mainMeal)/carbCal) ))
  // console.log("if 3 : " + ((afterIncremeantCal(carbMealSetting)+mainCal+addonsCal) < (sub.targetCalories*bp)))
  // console.log("if 4 : " + ((afterIncremeantCal(carbMealSetting)/mainCal)))

  if (totalConsumedCal < sub.targetCalories * bp) {
    if (
      afterIncremeantCal(mainMeal) + carbCal + addonsCal <
        sub.targetCalories * bp &&
      (afterIncremeantCal(mainMeal) / carbCal < 1.3 || isEmpty(carbMealSetting))
    ) {
      return "increase main meal";
    } else if (
      !isEmpty(carbMealSetting) &&
      afterIncremeantCal(carbMealSetting) + mainCal + addonsCal <
        sub.targetCalories * bp &&
      afterIncremeantCal(carbMealSetting) / mainCal < 1.1
    ) {
      console.log("carb inc");
      return "increase carb meal";
    }

    return "meal plan is completed";
  }
  return "meal plan is completed";
}

function getBreakfastPercentage(sub) {
  let numberOfMeals = 0;

  for (i in sub.categories) {
    if (
      sub.categories[i].categoryName.toLowerCase().includes("beef") ||
      sub.categories[i].categoryName.toLowerCase().includes("breakfast") ||
      sub.categories[i].categoryName.toLowerCase().includes("chicken") ||
      sub.categories[i].categoryName.toLowerCase().includes("seafood")
    ) {
      numberOfMeals++;
    }
  }

  if (numberOfMeals == 1) {
    return 1;
  } else if (numberOfMeals == 2) {
    return 0.52;
  } else if (numberOfMeals == 3) {
    return 0.38;
  } else {
    return 0.3;
  }
}

// categoryName: {
// selectedMealId: {
// boxNumber: {
// mealPortion: {

function getFormattedMeals(meals, boxNumber) {
  let formatted = [];

  if (Array.isArray(meals)) {
    for (i in meals) {
      let item = new Object();
      item.categoryName = meals[i].mealCategory;
      item.selectedMealId = meals[i]._id;
      item.mealPortion = meals[i].minServing;
      item.boxNumber = boxNumber;
      formatted.push(item);
    }
  } else {
    let item = new Object();
    item.categoryName = meals.mealData.mealCategory;
    item.selectedMealId = meals.mealData._id;
    item.mealPortion = meals.mealServing;
    item.boxNumber = boxNumber;
    formatted.push(item);
  }
  return formatted;
}
function addBreakfast(sub, mealsData, mealsPlan) {
  let mainMealSetting = new Object();
  let carbMealSetting = new Object();
  let breakfastMeal = getBreakfastMeal(mealsData);
  breakfastMeal.boxNumber = getBoxNumber(mealsPlan, "Breakfast");
  breakfastMeal.AddonIds = getAddonsInBox(
    mealsPlan,
    breakfastMeal.boxNumber,
    "Breakfast"
  );
  let bPercent = getBreakfastPercentage(sub);
  let optionalAddOns = [];

  setDefaultPortion(mainMealSetting, breakfastMeal);

  if (!!breakfastMeal.carbs.length) {
    setDefaultPortion(
      carbMealSetting,
      getCarb(mealsData, mealsPlan, breakfastMeal)
    );
  }
  breakfastMeal.AddonIds.forEach((item) => {
    optionalAddOns.push(getMeal(item.mealId, mealsData));
  });

  let action = breakfastController(
    sub,
    mainMealSetting,
    carbMealSetting,
    optionalAddOns,
    bPercent
  );

  // TESTING CODE
  // console.log("before start! 1st meal: " + getCurrentCalories(mainMealSetting) + " actoion : " + action)
  // console.log("before start! 2nd meal: " + getCurrentCalories(carbMealSetting))

  while ("meal plan is completed" !== action) {
    switch (action) {
      case "increase main meal":
        increasePortion(mainMealSetting);
        break;
      case "increase carb meal":
        increasePortion(carbMealSetting);
        break;
    }
    action = breakfastController(
      sub,
      mainMealSetting,
      carbMealSetting,
      optionalAddOns,
      bPercent
    );
    //console.log("next round B controller:" + action)
  }

  //  TESTING CODE
  // console.log("broke successfully! 1st meal: " + getCurrentCalories(mainMealSetting))
  // console.log("broke successfully! 2nd meal: " + getCurrentCalories(carbMealSetting))

  // console.log("planned: " + sub.targetCalories*bPercent)
  // console.log("carbCalOutput: " + getCurrentCalories(carbMealSetting) + " and obj: " + carbMealSetting)
  // let totalcc = getCurrentCalories(carbMealSetting) + getCurrentCalories(mainMealSetting) + getTotalMinCalories(optionalAddOns)
  // console.log("actual meal calories: " + totalcc)
  // console.log("check carb meal data: " + JSON.stringify(carbMealSetting) + "total addons cal: " + getTotalMinCalories(optionalAddOns))

  let mealsSettingOutput = getFormattedMeals(
    mainMealSetting,
    breakfastMeal.boxNumber
  );
  optionalAddOns = getFormattedMeals(optionalAddOns, breakfastMeal.boxNumber);
  mealsSettingOutput = mealsSettingOutput.concat(optionalAddOns);
  if (!!breakfastMeal.carbs.length) {
    mealsSettingOutput.push(
      getFormattedMeals(carbMealSetting, breakfastMeal.boxNumber)
    );
  }
  //console.log("output2 +_+_+_+_+_+_:" + JSON.stringify(mealsSettingOutput) + "finish")
  return mealsSettingOutput;
}

function checkIfSnack(cat, mealPlan) {
  let category = cat;
  if (
    String(category).toLowerCase() == "beef" ||
    String(category).toLowerCase() == "chicken" ||
    String(category).toLowerCase() == "seafood" ||
    String(category).toLowerCase() == "breakfast"
  ) {
    return false;
  }
  for (i in mealPlan) {
    if (mealPlan[i].mealCategory == category) {
      for (ii in mealPlan) {
        if (
          mealPlan[i].boxNumber == mealPlan[ii].boxNumber &&
          mealPlan[ii].mealCategory !== category
        ) {
          return false;
        }
      }
    }
  }

  return true;
}

function addSnack(cat, mealsData, mealsPlan) {
  for (i in mealsPlan) {
    if (mealsPlan[i].mealCategory == cat) {
      let meal = getMeal(mealsPlan[i].mealId, mealsData);
      let mealSetting = new Object();

      mealSetting.categoryName = meal.mealCategory;
      mealSetting.selectedMealId = meal._id;
      mealSetting.mealPortion = meal.minServing;
      mealSetting.boxNumber = getBoxNumber(mealsPlan, cat);
      return mealSetting;
    }
  }
}

function updateRemainingMeals(catNames, mealsSettings) {
  let completedMealsCategories = mealsSettings.map((item) => item.categoryName);
  for (i in completedMealsCategories) {
    if (catNames.includes(completedMealsCategories[i])) {
      removeFromArray(catNames, completedMealsCategories[i]);
    }
  }
  return catNames;
}

function getTotalCalories(mealsSettings, mealsData) {
  let totalCal = 0;
  for (i in mealsSettings) {
    let meal = getMeal(mealsSettings[i].selectedMealId, mealsData);
    totalCal +=
      (mealsSettings[i].mealPortion / meal.minServing) *
      ((meal.minservingprotein + meal.minservingCarbs) * 4 +
        meal.minservingfat * 9);
  }
  //console.log("total currnet cal : " + totalCal)
  return totalCal;
}

function countMainDishes(list) {
  let counter = 0;
  for (i in list) {
    if (
      list[i].categoryName.toLowerCase().includes("beef") ||
      list[i].categoryName.toLowerCase().includes("breakfast") ||
      list[i].categoryName.toLowerCase().includes("chicken") ||
      list[i].categoryName.toLowerCase().includes("seafood")
    ) {
      counter++;
    }
  }
  return counter;
}

function getMealTargetCalories(sub, mealsSettings, mealsData) {
  let requestedMealsCount = countMainDishes(sub.categories);
  let plannedMealsCount = countMainDishes(mealsSettings);
  let remainingCal =
    sub.targetCalories - getTotalCalories(mealsSettings, mealsData);
  let mealTargetCal =
    (1 / (requestedMealsCount - plannedMealsCount)) * remainingCal;

  return mealTargetCal;
}

function getMealandBox(mealsPlan, mealsSettings, cat, mealsData) {
  let value = new Object();
  for (i in mealsPlan) {
    if (mealsPlan[i].mealCategory.includes(cat)) {
      let duplicate = false;
      for (n in mealsSettings) {
        if (mealsSettings[n].selectedMealId == mealsPlan[i].mealId) {
          duplicate = true;
        }
      }

      if (duplicate == false) {
        value.mealData = getMeal(mealsPlan[i].mealId, mealsData);
        value.boxNumber = mealsPlan[i].boxNumber;
        return value;
      }
    }
  }

  for (i in mealsPlan) {
    if (mealsPlan[i].mealCategory.includes(cat)) {
      value.mealData = getMeal(mealsPlan[i].mealId, mealsData);
      value.boxNumber = mealsPlan[i].boxNumber;
      return value;
    }
  }
}

function mealController(
  sub,
  mainMeal,
  carbMealSetting,
  optionalAddOns,
  targetCalories
) {
  let mainCal = getCurrentCalories(mainMeal);
  let carbCal = getCurrentCalories(carbMealSetting);
  let addonsCal = getTotalMinCalories(optionalAddOns);
  let totalConsumedCal = mainCal + carbCal + addonsCal;

  //    TESTING CODE
  //  console.log("calories targeted: " + (sub.targetCalories*bp) + " current total: " + totalConsumedCal )
  // console.log("if increase main: " + (afterIncremeantCal(mainMeal)+carbCal+addonsCal))
  // console.log("if increase crb: " + (afterIncremeantCal(carbMealSetting)+mainCal+addonsCal))

  // console.log("if 1 : " + ((afterIncremeantCal(mainMeal)+carbCal+addonsCal) < (sub.targetCalories*bp)))
  // console.log("if 2 : " + ((afterIncremeantCal(mainMeal)/carbCal) ))
  // console.log("if 3 : " + ((afterIncremeantCal(carbMealSetting)+mainCal+addonsCal) < (sub.targetCalories*bp)))
  // console.log("if 4 : " + ((afterIncremeantCal(carbMealSetting)/mainCal)))

  if (totalConsumedCal < targetCalories) {
    if (
      afterIncremeantCal(mainMeal) + carbCal + addonsCal < targetCalories &&
      (afterIncremeantCal(mainMeal) / carbCal < 1.3 || isEmpty(carbMealSetting))
    ) {
      return "increase main meal";
    } else if (
      !isEmpty(carbMealSetting) &&
      afterIncremeantCal(carbMealSetting) + mainCal + addonsCal <
        targetCalories &&
      afterIncremeantCal(carbMealSetting) / mainCal < 1.1
    ) {
      return "increase carb meal";
    }

    return "meal plan is completed";
  }
  return "meal plan is completed";
}

function getFormattedCarbs(setting, boxNumber) {
  let item = new Object();
  item.categoryName = setting.mealData.mealCategory;
  item.selectedMealId = setting.mealData._id;
  item.mealPortion = setting.mealServing;
  item.boxNumber = boxNumber;
  return item;
}

function addMeal(sub, mealsData, mealsPlan, mealsSettings, cat) {
  let targetCalories = getMealTargetCalories(sub, mealsSettings, mealsData);
  let mainMealSetting = new Object();
  let carbMealSetting = new Object();
  mainMealSetting = getMealandBox(mealsPlan, mealsSettings, cat, mealsData);
  mainMealSetting.AddonIds = getAddonsInBox(
    mealsPlan,
    mainMealSetting.boxNumber,
    cat
  );
  let optionalAddOns = [];

  mainMealSetting.AddonIds.forEach((item) => {
    optionalAddOns.push(getMeal(item.mealId, mealsData));
  });

  setDefaultPortion(mainMealSetting, mainMealSetting.mealData);
  if (!!mainMealSetting.mealData.carbs.length) {
    setDefaultPortion(
      carbMealSetting,
      getCarb(mealsData, mealsPlan, mainMealSetting.mealData)
    );
  }
  //console.log("checking ch data:-------------- " + JSON.stringify(carbMealSetting))

  let action = mealController(
    sub,
    mainMealSetting,
    carbMealSetting,
    optionalAddOns,
    targetCalories
  );

  // TESTING CODE
  // console.log("anymeal before start! 1st meal: " + getCurrentCalories(mainMealSetting) + " actoion : " + action)
  // console.log("anymeal before start! 2nd meal: " + getCurrentCalories(carbMealSetting))

  while ("meal plan is completed" !== action) {
    switch (action) {
      case "increase main meal":
        increasePortion(mainMealSetting);
        break;
      case "increase carb meal":
        increasePortion(carbMealSetting);
        break;
    }
    action = mealController(
      sub,
      mainMealSetting,
      carbMealSetting,
      optionalAddOns,
      targetCalories
    );
    // console.log(" anymeal next round B controller:" + action)
  }

  // TESTING
  // console.log("anymeal broke successfully! 1st meal: " + getCurrentCalories(mainMealSetting))
  // console.log("anymeal broke successfully! 2nd meal: " + getCurrentCalories(carbMealSetting))

  let mealsSettingOutput = getFormattedMeals(
    mainMealSetting,
    mainMealSetting.boxNumber
  );
  optionalAddOns = getFormattedMeals(optionalAddOns, mainMealSetting.boxNumber);
  mealsSettingOutput = mealsSettingOutput.concat(optionalAddOns);

  if (!!mainMealSetting.mealData.carbs.length) {
    mealsSettingOutput.push(
      getFormattedCarbs(carbMealSetting, mainMealSetting.boxNumber)
    );
  }
  //console.log("output2 +_+_+_+_+_+_:" + JSON.stringify(mealsSettingOutput) + "finish")
  return mealsSettingOutput;
}

function getNutritions(mealsSettings, client, mealsData) {
  let total = new Object();
  total.p = 0;
  total.c = 0;
  total.f = 0;
  for (i in mealsSettings) {
    let meal = getMeal(mealsSettings[i].selectedMealId, mealsData);
    total.p +=
      (mealsSettings[i].mealPortion / meal.minServing) * meal.minservingprotein;
    total.f +=
      (mealsSettings[i].mealPortion / meal.minServing) * meal.minservingfat;
    total.c +=
      (mealsSettings[i].mealPortion / meal.minServing) * meal.minservingCarbs;
  }

  console.log(
    "CLIENT " +
      client.clientId +
      " with target cal: " +
      client.targetCalories +
      " - protien: " +
      total.p +
      " - carbs: " +
      total.c +
      "- fat: " +
      total.f
  );
  console.log("real total cal :" + ((total.p + total.c) * 4 + 9 * total.f));

  return total;
}

function getProtienStatus(mealsSettings, sub, mealsData) {
  let p = 0;

  for (i in mealsSettings) {
    let meal = getMeal(mealsSettings[i].selectedMealId, mealsData);
    p +=
      (mealsSettings[i].mealPortion / meal.minServing) * meal.minservingprotein;
  }

  if (p < sub.targetProtien + 6 && p > sub.targetProtien - 6) {
    return "Within";
  } else if (p < sub.targetProtien - 6) {
    return "Under";
  } else {
    return "Exceeded";
  }
}

function getCaloriesStatus(mealsSettings, sub, mealsData) {
  let p = 0;
  let c = 0;
  let f = 0;

  for (i in mealsSettings) {
    let meal = getMeal(mealsSettings[i].selectedMealId, mealsData);
    p +=
      (mealsSettings[i].mealPortion / meal.minServing) * meal.minservingprotein;
    c +=
      (mealsSettings[i].mealPortion / meal.minServing) * meal.minservingCarbs;
    f += (mealsSettings[i].mealPortion / meal.minServing) * meal.minservingfat;
  }

  let totalCal = (p + c) * 4 + 9 * f;
  if (
    totalCal < sub.targetCalories + 75 &&
    totalCal > sub.targetCalories - 75
  ) {
    return "Within";
  } else if (totalCal < sub.targetCalories - 75) {
    return "Under";
  } else {
    return "Exceeded";
  }
}

function getCalories(meal, mealsData) {
  let mealData = getMeal(meal.selectedMealId, mealsData);
  let pAndC =
    (meal.mealPortion / mealData.minServing) *
    (mealData.minservingprotein + mealData.minservingCarbs) *
    4;
  let f = (meal.mealPortion / mealData.minServing) * mealData.minservingfat * 9;
  return pAndC + f;
}

function getBoxCalories(meal, mealsData, mealsSettings) {
  let totalCal = 0;
  for (i in mealsSettings) {
    if (mealsSettings[i].boxNumber == meal.boxNumber) {
      totalCal += getCalories(mealsSettings[i], mealsData);
    }
  }
  return totalCal;
}

function search(a, v) {
  if (a[0] > v) {
    return 0;
  }
  var i = 1;
  while (i < a.length && !(a[i] > v && a[i - 1] <= v)) {
    i = i + 1;
  }
  return i;
}

function getProtienPercent(meal, mealsData) {
  let mealData = getMeal(meal.selectedMealId, mealsData);

  let p =
    (meal.mealPortion / mealData.minServing) * mealData.minservingprotein * 4;
  let c =
    (meal.mealPortion / mealData.minServing) * mealData.minservingCarbs * 4;
  let f = (meal.mealPortion / mealData.minServing) * mealData.minservingfat * 9;

  return p / (p + c + f);
}

function search(a, v) {
  if (a[0] > v) {
    return 0;
  }
  var i = 1;
  while (i < a.length && !(a[i] > v && a[i - 1] <= v)) {
    i = i + 1;
  }
  return i;
}

function canDecreaseP(mealSetting, mealsData) {
  let mealData = getMeal(mealSetting.selectedMealId, mealsData);

  if (
    mealData.minServing <=
    mealSetting.mealPortion - mealData.incrementPortion
  ) {
    return true;
  }
  return false;
}

function notUnderCal(testMeal, sub, mealsSettings, mealsData) {
  let totalCal = 0;

  for (i in mealsSettings) {
    if (
      mealsSettings[i].selectedMealId == testMeal.selectedMealId &&
      mealsSettings[i].boxNumber == testMeal.boxNumber
    ) {
      totalCal += getCalories(testMeal, mealsData);
    } else {
      totalCal += getCalories(mealsSettings[i], mealsData);
    }
  }
  return sub.targetCalories - 85 <= totalCal;
}

function canDecreaseC(mealSetting, mealsData, sub, mealsSettings) {
  let mealData = getMeal(mealSetting.selectedMealId, mealsData);
  let testMeal = Object.assign({}, mealSetting);
  testMeal.mealPortion = mealSetting.mealPortion - mealData.incrementPortion;
  if (
    notUnderCal(testMeal, sub, mealsSettings, mealsData) &&
    mealData.minServing <= mealSetting.mealPortion - mealData.incrementPortion
  ) {
    return true;
  }
  return false;
}

function canIncreaseP(mealSetting, mealsData) {
  let mealData = getMeal(mealSetting.selectedMealId, mealsData);
  if (
    mealData.maxserving >=
    mealSetting.mealPortion + mealData.incrementPortion
  ) {
    return true;
  }
  return false;
}

function notExceedCal(testMeal, sub, mealsSettings, mealsData) {
  let totalCal = 0;

  for (i in mealsSettings) {
    if (
      mealsSettings[i].selectedMealId == testMeal.selectedMealId &&
      mealsSettings[i].boxNumber == testMeal.boxNumber
    ) {
      totalCal += getCalories(testMeal, mealsData);
    } else {
      totalCal += getCalories(mealsSettings[i], mealsData);
    }
  }

  return sub.targetCalories + 85 >= totalCal;
}

function canIncreaseC(mealSetting, mealsData, sub, mealsSettings) {
  let mealData = getMeal(mealSetting.selectedMealId, mealsData);
  let testMeal = mealSetting;
  testMeal.mealPortion = mealSetting.mealPortion + mealData.incrementPortion;
  if (
    mealData.maxserving >=
      mealSetting.mealPortion + mealData.incrementPortion &&
    notExceedCal(testMeal, sub, mealsSettings, mealsData)
  ) {
    return true;
  }
  return false;
}

function decreaseP(mealSetting, mealsData, mealsSettings) {
  let mealData = getMeal(mealSetting.selectedMealId, mealsData);

  mealSetting.mealPortion = mealSetting.mealPortion - mealData.incrementPortion;
  for (i in mealsSettings) {
    if (
      mealsSettings[i].selectedMealId == mealSetting.selectedMealId &&
      mealsSettings[i].boxNumber == mealSetting.boxNumber
    ) {
      mealsSettings[i] = mealSetting;
      return mealsSettings;
    }
  }
  return null;
}

function decreaseC(mealSetting, mealsData, mealsSettings) {
  let mealData = getMeal(mealSetting.selectedMealId, mealsData);

  mealSetting.mealPortion = mealSetting.mealPortion - mealData.incrementPortion;
  for (i in mealsSettings) {
    if (
      mealsSettings[i].selectedMealId == mealSetting.selectedMealId &&
      mealsSettings[i].boxNumber == mealSetting.boxNumber
    ) {
      mealsSettings[i] = mealSetting;
      //console.log("0-0-0-0--0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0 not sure why : " + JSON.stringify(mealSetting))
      return mealsSettings;
    }
  }
  return null;
}

function increaseP(mealSetting, mealsData, mealsSettings) {
  let mealData = getMeal(mealSetting.selectedMealId, mealsData);

  mealSetting.mealPortion = mealSetting.mealPortion + mealData.incrementPortion;
  for (i in mealsSettings) {
    if (
      mealsSettings[i].selectedMealId == mealSetting.selectedMealId &&
      mealsSettings[i].boxNumber == mealSetting.boxNumber
    ) {
      mealsSettings[i] = mealSetting;
      return mealsSettings;
    }
  }
  return null;
}

function increaseC(mealSetting, mealsData, mealsSettings) {
  let mealData = getMeal(mealSetting.selectedMealId, mealsData);

  mealSetting.mealPortion = mealSetting.mealPortion + mealData.incrementPortion;
  for (i in mealsSettings) {
    if (
      mealsSettings[i].selectedMealId == mealSetting.selectedMealId &&
      mealsSettings[i].boxNumber == mealSetting.boxNumber
    ) {
      mealsSettings[i] = mealSetting;
      return mealsSettings;
    }
  }
  return null;
}

function decreaseSubProtien(mealsSettings, mealsData) {
  let mrank = [];
  let prank = [];

  for (n in mealsSettings) {
    if (
      mealsSettings[n].categoryName.toLowerCase().includes("beef") ||
      mealsSettings[n].categoryName.toLowerCase().includes("breakfast") ||
      mealsSettings[n].categoryName.toLowerCase().includes("chicken") ||
      mealsSettings[n].categoryName.toLowerCase().includes("seafood")
    ) {
      //let thisCal = getBoxCalories(mealsSettings[n], mealsData, mealsSettings)
      let protienPercentage = getProtienPercent(mealsSettings[n], mealsData);
      //console.log("resutl of search is : " + )
      //console.log("testing: " + mealsSettings[n].categoryName + " and p%: " + protienPercentage )
      mrank.splice(search(prank, protienPercentage), 0, mealsSettings[n]);
      prank.splice(search(prank, protienPercentage), 0, protienPercentage);
      //add2(thisCal, crank, mealsSettings[n], mrank)
    }
  }
  //console.log("before updating : " + JSON.stringify(mealsSettings))
  for (var i = mrank.length - 1; i >= 0; i--) {
    //for (var i = 0; i < mrank.length; i++) {
    //console.log("this is " + i + " and : " + JSON.stringify(mrank[i]))
    if (canDecreaseP(mrank[i], mealsData)) {
      mealsSettings = decreaseP(mrank[i], mealsData, mealsSettings);
      //console.log("updated protien- : " + JSON.stringify(mrank[i]))
      break;
    }
  }

  return mealsSettings;
}

function increaseSubProtien(mealsSettings, mealsData) {
  let mrank = [];
  let prank = [];

  for (n in mealsSettings) {
    if (
      mealsSettings[n].categoryName.toLowerCase().includes("beef") ||
      mealsSettings[n].categoryName.toLowerCase().includes("breakfast") ||
      mealsSettings[n].categoryName.toLowerCase().includes("chicken") ||
      mealsSettings[n].categoryName.toLowerCase().includes("seafood")
    ) {
      //let thisCal = getBoxCalories(mealsSettings[n], mealsData, mealsSettings)
      let protienPercentage = getProtienPercent(mealsSettings[n], mealsData);
      //console.log("resutl of search is : " + )
      //console.log("testing: " + mealsSettings[n].categoryName + " and p%: " + protienPercentage )
      mrank.splice(search(prank, protienPercentage), 0, mealsSettings[n]);
      prank.splice(search(prank, protienPercentage), 0, protienPercentage);
      //add2(thisCal, crank, mealsSettings[n], mrank)
    }
  }
  //console.log("before updating : " + JSON.stringify(mealsSettings))
  for (var i = mrank.length - 1; i >= 0; i--) {
    //for (var i = 0; i < mrank.length; i++) {
    //console.log("this is " + i + " and : " + JSON.stringify(mrank[i]))
    if (canIncreaseP(mrank[i], mealsData)) {
      mealsSettings = increaseP(mrank[i], mealsData, mealsSettings);
      //console.log("updated protien+ : " + JSON.stringify(mrank[i]))
      break;
    }
  }

  return mealsSettings;
}

function decreaseSubCalories(mealsSettings, mealsData, sub) {
  let mrank = [];
  let prank = [];

  for (n in mealsSettings) {
    if (
      mealsSettings[n].categoryName.toLowerCase().includes("beef") ||
      mealsSettings[n].categoryName.toLowerCase().includes("breakfast") ||
      mealsSettings[n].categoryName.toLowerCase().includes("chicken") ||
      mealsSettings[n].categoryName.toLowerCase().includes("seafood") ||
      mealsSettings[n].categoryName.toLowerCase().includes("carb")
    ) {
      //console.log("testing cal dec: " + mealsSettings[n].categoryName )

      //let thisCal = getBoxCalories(mealsSettings[n], mealsData, mealsSettings)
      let protienPercentage = getProtienPercent(mealsSettings[n], mealsData);
      //console.log("resutl of search is : " + )
      //console.log("testing: " + mealsSettings[n].categoryName + " and p%: " + protienPercentage )
      mrank.splice(search(prank, protienPercentage), 0, mealsSettings[n]);
      prank.splice(search(prank, protienPercentage), 0, protienPercentage);
    }
  }

  for (var i = 0; i < mrank.length; i++) {
    //console.log("inside dec +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++" + canDecreaseC(mrank[i], mealsData, sub, mealsSettings))
    //console.log("this is " + i + " and : " + JSON.stringify(mrank[i]))
    if (canDecreaseC(mrank[i], mealsData, sub, mealsSettings)) {
      mealsSettings = decreaseC(mrank[i], mealsData, mealsSettings);
      //console.log("updated cal-: " + JSON.stringify(mrank[i]))
      break;
    }
    //console.log("this is " + i + " and : " + JSON.stringify(mrank[i]))
  }

  return mealsSettings;
}

function increaseSubCalories(mealsSettings, mealsData, sub) {
  let mrank = [];
  let prank = [];

  for (n in mealsSettings) {
    if (
      mealsSettings[n].categoryName.toLowerCase().includes("beef") ||
      mealsSettings[n].categoryName.toLowerCase().includes("breakfast") ||
      mealsSettings[n].categoryName.toLowerCase().includes("chicken") ||
      mealsSettings[n].categoryName.toLowerCase().includes("seafood") ||
      mealsSettings[n].categoryName.toLowerCase().includes("carb")
    ) {
      //console.log("testing cal dec: " + mealsSettings[n].categoryName )

      //let thisCal = getBoxCalories(mealsSettings[n], mealsData, mealsSettings)
      let protienPercentage = getProtienPercent(mealsSettings[n], mealsData);
      //console.log("resutl of search is : " + )
      //console.log("testing: " + mealsSettings[n].categoryName + " and p%: " + protienPercentage )
      mrank.splice(search(prank, protienPercentage), 0, mealsSettings[n]);
      prank.splice(search(prank, protienPercentage), 0, protienPercentage);
    }
  }

  for (var i = 0; i < mrank.length; i++) {
    //console.log("this is " + i + " and : " + JSON.stringify(mrank[i]))
    if (canIncreaseC(mrank[i], mealsData, sub, mealsSettings)) {
      mealsSettings = increaseC(mrank[i], mealsData, mealsSettings);
      //console.log("updated cal+ : " + JSON.stringify(mrank[i]))
      break;
    }
  }

  return mealsSettings;
}

function protienAndCalModifier(sub, mealsData, mealsSettings, mealsPlan) {
  let protienStatus = getProtienStatus(mealsSettings, sub, mealsData);
  let caloriesStatus = getCaloriesStatus(mealsSettings, sub, mealsData);
  //console.log("Protien status : " + protienStatus + " and cal status : " + caloriesStatus)
  // let calTarget =
  //decreaseSubCalories(mealsSettings, mealsData, sub)

  let continueOperation = true;
  let i = 0;
  while (continueOperation) {
    // while(i<100){
    if (caloriesStatus == "Exceeded" && protienStatus == "Exceeded") {
      decreaseSubProtien(mealsSettings, mealsData);
    } else if (caloriesStatus == "Exceeded" && protienStatus == "Within") {
      decreaseSubCalories(mealsSettings, mealsData, sub);
    } else if (caloriesStatus == "Exceeded" && protienStatus == "Under") {
      decreaseSubCalories(mealsSettings, mealsData, sub);
      //console.log("22=-=-=-=-=-=-check : " + JSON.stringify(mealsSettings))
    } else if (caloriesStatus == "Within" && protienStatus == "Exceeded") {
      decreaseSubProtien(mealsSettings, mealsData);
    } else if (caloriesStatus == "Within" && protienStatus == "Within") {
      continueOperation = false;
    } else if (caloriesStatus == "Within" && protienStatus == "Under") {
      increaseSubProtien(mealsSettings, mealsData);
    } else if (caloriesStatus == "Under" && protienStatus == "Exceeded") {
      increaseSubCalories(mealsSettings, mealsData, sub);
    } else if (caloriesStatus == "Under" && protienStatus == "Within") {
      increaseSubCalories(mealsSettings, mealsData, sub);
    } else if (caloriesStatus == "Under" && protienStatus == "Under") {
      increaseSubProtien(mealsSettings, mealsData);
      //increaseSubCalories(mealsSettings, mealsData, sub)
    }
    protienStatus = getProtienStatus(mealsSettings, sub, mealsData);
    caloriesStatus = getCaloriesStatus(mealsSettings, sub, mealsData);
    //console.log("Calories status : " + caloriesStatus  + " and Protien status : " + protienStatus)
    // if(caloriesStatus == "Exceeded" && protienStatus == "Under"){
    //   console.log("this is happening!---------------------------------------------------")
    //   console.log("=-=-=-=-=-=-check : " + JSON.stringify(mealsSettings))
    // }

    // i++;
  }

  return mealsSettings;
}

// function updateRound(cookingRound, mealsSettings, sub, mealsData, startDate, endDate) {
//   cookingRound.roundId = 1
//   cookingRound.startDate = startDate
//   cookingRound.endDate = endDate

//   for( i in mealsSettings){
//     //let mealData = getMeal(mealsSettings[i].selectedMealId, mealsData)
//     console.log("find meal data: " + JSON.stringify(mealsSettings[i]))
//     let clientMealData = new Object()
//     clientMealData.clientId = sub.clientId
//     clientMealData.uncookedPlannedPortion = mealsSettings[i].mealPortion
//     clientMealData.boxNumber = mealsSettings[i].boxNumber

//     let added = false
//     for (n in cookingRound.mealSettings){
//       if(mealsSettings[i].selectedMealId == cookingRound.mealSettings[n].mealId){
//         cookingRound.mealSettings[n].clients.push(clientMealData)
//         added = true
//       }
//     }
//     if(!added){
//       let mealData = new Object()
//       mealData.mealCategory = mealsSettings[i].categoryName
//       mealData.mealId = mealsSettings[i].selectedMealId
//       mealData.clients = []
//       mealData.clients.push(clientMealData)
//       cookingRound.mealSettings.push(mealData)
//     }

//     const addRound = new Round()

//   }

//   // for (oneSub in subscriptions){
//   //   const addSubscription = new Subscription({clientId: requestedClientId, targetProtien: subscriptions[oneSub].targetProtien, targetCalories: subscriptions[oneSub].targetCalories,
//   //   date: subscriptions[oneSub].date, categories: subscriptions[oneSub].categories });
//   //   const added = await addSubscription.save();
//   //   const categoriesAdded = await added.update(
//   //     { $addToSet: { categories: subscriptions[oneSub].categories } },
//   //     { new: true })
//   //   console.log("this is number:  " + oneSub + "  and value:  " + added + "categories added:  " + categoriesAdded)

//   // }

//   console.log("testing 000000000000000000000000000000 : " + JSON.stringify(cookingRound))

// }

async function updateRound(cookingRound, mealsSettings, sub) {
  for (i in mealsSettings) {
    let added = false;
    for (n in cookingRound.mealSettings) {
      //console.log(cookingRound.mealSettings[0].categoryName + " this is happen +++++++++++++++++++++++++++++++++++++++")
      if (
        cookingRound.mealSettings[n].categoryName ==
        mealsSettings[i].categoryName
      ) {
        cookingRound.mealSettings[n].clients.push({
          clientId: sub.clientId,
          date: sub.date,
          uncookedPlannedPortion: mealsSettings[i].mealPortion,
          boxNumber: mealsSettings[i].boxNumber,
        });
        added = true;
      }
    }
    if (!added) {
      cookingRound.mealSettings.push({
        categoryName: mealsSettings[i].categoryName,
        mealId: mealsSettings[i].selectedMealId,
        clients: {
          clientId: sub.clientId,
          date: sub.date,
          uncookedPlannedPortion: mealsSettings[i].mealPortion,
          boxNumber: mealsSettings[i].boxNumber,
        },
      });
    }
  }

  //const added = await cookingRound.save();
  // const categoriesAdded = await cookingRound.updateOne(
  //   {$addToSet: { mealSettings: {mealCategory:"test", mealId:"fdf"} }}
  // )
}

async function getCookingRoundId() {
  const item = await Round.find().sort({ roundId: -1 }).limit(1);
  if (item[0]) {
    return item[0].roundId + 1;
  } else {
    return 1;
  }
}

function setPlannedIngredients(cookingRound, mealsData) {
  for (i in cookingRound.mealSettings) {
    let mealData = getMeal(cookingRound.mealSettings[i].mealId, mealsData);
    let totalPortion = 0;
    for (n in cookingRound.mealSettings[i].clients) {
      totalPortion +=
        cookingRound.mealSettings[i].clients[n].uncookedPlannedPortion;
    }
    for (j in mealData.ingredients) {
      cookingRound.mealSettings[i].plannedIngredients.push({
        ingredientName: mealData.ingredients[j].ingredientName,
        totalIngredientWeight: mealData.ingredients[j].ingredientWeight,
      });
    }
  }

  return cookingRound;
}

router.post("/createround", async (req, res) => {
  try {
    const { newRoundId, startDate, endDate, mealsPlan } = req.body;
    console.log(req.body);
    //Load Selected subsicriptions
    const subs = await Subscriptions.find({
      date: { $gte: startDate, $lte: endDate },
    });
    //Load Selected Meals
    const selectedMealsIds = mealsPlan.map((item) => {
      console.log(item.mealId);
      return item.mealId;
    });
    const mealsData = await Meal.find({ _id: selectedMealsIds });

    const cookingRound = new Round({
      roundId: newRoundId,
      startDate: startDate,
      endDate: endDate,
    });

    for (sub in subs) {
      //this could be outside the for loop
      let mealsSettings = [];
      let catNames = subs[sub].categories.map((item) => item.categoryName);
      if (catNames.includes("Breakfast")) {
        mealsSettings = mealsSettings.concat(
          addBreakfast(subs[sub], mealsData, mealsPlan)
        );
        // console.log("Breakfast Settings for client : " + subs[sub].clientId + " is " + JSON.stringify(mealsSettings))

        updateRemainingMeals(catNames, mealsSettings);
      }

      for (i in catNames) {
        let x = catNames[i];
        if (checkIfSnack(x, mealsPlan)) {
          mealsSettings.push(addSnack(x, mealsData, mealsPlan));
        }
      }

      //adding chicken meals first
      for (i in catNames) {
        let x = catNames[i];

        //console.log("checking the vlaues +++: "+ JSON.stringify(mealsSettings))
        let chickenMeal = addMeal(
          subs[sub],
          mealsData,
          mealsPlan,
          mealsSettings,
          catNames[i]
        );

        mealsSettings = mealsSettings.concat(chickenMeal);
        //console.log("checking last" + JSON.stringify(mealsSettings))
      }

      console.log(
        "----------------------------------------BEFORE------------------------------------"
      );
      getNutritions(mealsSettings, subs[sub], mealsData);
      mealsSettings = protienAndCalModifier(
        subs[sub],
        mealsData,
        mealsSettings,
        mealsPlan
      );

      console.log(
        "----------------------------------------AFTER------------------------------------"
      );
      getNutritions(mealsSettings, subs[sub], mealsData);
      console.log("meals for client: " + JSON.stringify(mealsSettings));

      updateRound(cookingRound, mealsSettings, subs[sub]);
      //updateRemainingMeals(catNames, mealsSettings)
      //console.log("current meal plan : " + JSON.stringify(mealsSettings))
      //console.log("checking remaining cats: " + catNames)

      //check if there is snack in mealsplan that is not part of sub cats
    }
    setPlannedIngredients(cookingRound, mealsData);
    console.log(
      "----------------------tdsting: " + JSON.stringify(cookingRound)
    );
    const added = await cookingRound.save();
    res.status(201).json(cookingRound);
  } catch (error) {
    console.log(error);
    res.status(422).json(error);
  }
});

router.get("/getAllRounds", async (req, res) => {
  try {
    const roundsList = await Round.find();
    res.status(201).json(roundsList);
  } catch (error) {
    res.status(422).json(error);
  }
});

module.exports = router;
