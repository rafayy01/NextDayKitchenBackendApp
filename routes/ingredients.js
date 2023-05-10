const router = require("express").Router();
const meals = require("../models/meal");


router.get("/:id", async (req, res) => {
  try {
    const mealId = req.params.id;
    const meal = await meals.findById({ _id: mealId });
    const ingredients = meal.ingredients;

    res.status(201).json(ingredients);
  } catch (error) {
    res.status(422).json(error);
  }
});

router.put("/addingredient/:id", async (req, res) => {
  try {
    const mealId = req.params.id;
    const { ingredients } = req.body;

    const meal = await meals.findById({ _id: mealId });

    if (meal) {
      const uniqueIngredientName = meal.ingredients.map((value) => {
        return value.ingredientName;
      });

      console.log(uniqueIngredientName);

      if (!uniqueIngredientName.includes(ingredients[0].ingredientName)) {
        const mealIngredient = await meals.findByIdAndUpdate(
          mealId,
          { $addToSet: { ingredients: ingredients } },
          { new: true }
        );
        res.status(201).send(mealIngredient);
      }else{
        res.status(402).send({ error: "Meal Ingredients Name already Exist" });
      }
    } else {
      res.status(402).send({ error: "ID Can't be found" });
    }
  } catch (error) {
    res.status(422).json(error);
  }
});

//modify ingredient


//delete ingredient
// router.delete("/deleteingredient/:id", async (res, res) => {
//     const mealId = req.params.id;
//     const ingredientsId = req.body;

//     const deleteIngredient = await meals.findByIdAndUpdate()

// })



// delete user
router.delete("/deleteingredient/:id", async (req, res) => {
  try {
    const mealId = req.params.id;
    const {ingredientId} = req.body;

        meals.findOne({ _id: mealId}, (error, doc) => {
          if (error) {
            console.log(error);
          } else {
            doc.ingredients.pull(ingredientId);
            doc.save((error) => {
              if (error) {
                console.log(error);
              } else {
                console.log('Document updated successfully!');
                res.status(201).send(doc);
              }
            });
          }
        });
  } catch (error) {
    res.status(422).json(error);
  }
});

module.exports = router;
