const router = require("express").Router();
const meals = require("../models/mealsOldd");


router.post("/addMeal",async(req,res)=>{
    const {mealName,mealDesc, mealType} = req.body;
    
    console.log(req.body);
    console.log("test- ------------------" + mealType)
    if(!mealName && !mealType){
        res.status(422).send({error:"Meal Name & Meal Type are required!"} );
    }

    try {
        const premeal = await meals.findOne({mealName:mealName});
        console.log(premeal);
        if(premeal){
            res.status(422).send({error: "The meal name is taken!"});
        } else{
            const addmeal = new meals({
                mealName, mealDesc, mealType
            });
            await addmeal.save();
            console.log("saved");
            res.status(201).json(addmeal);
            console.log(addmeal);
        }

    } catch (error) {
        res.status(422).json({error: "error"});
    }
})

// delete user
router.delete("/deletemeal/:id",async(req,res)=>{
    try {
        const {id} = req.params;

        const deletmeal = await meals.findByIdAndDelete({_id:id})
        console.log(id);
        if(deletmeal){
        console.log(deletmeal);
        res.status(201).json(deletmeal);
        } else {
            res.status(402).send({error: "ID Can't be found"});
        }

    } catch (error) {
        res.status(422).send({error: "can't find id"});
    }
})


// get Alluserlist

router.get("/getmeals/",async(req,res)=>{
    try {
        const mealList = await meals.find();
        res.status(201).json(mealList)
    } catch (error) {
        res.status(422).json(error);
    }
})

// get individual user

router.get("/getuser/:id",async(req,res)=>{
    try {
        console.log(req.params);
        const {id} = req.params.id;

        const userindividual = await users.findById({_id:id});
        console.log(userindividual);
        res.status(201).json(userindividual)

    } catch (error) {
        res.status(422).json(error);
    }
})


// update user data
router.patch("/updateuser/:id",async(req,res)=>{
    try {
        const {id} = req.params.id;

        const updateduser = await users.findByIdAndUpdate(id,req.body,{
            new:true
        });

        console.log(updateduser);
        res.status(201).json(updateduser);

    } catch (error) {
        res.status(422).json(error);
    }
})







module.exports = router;










