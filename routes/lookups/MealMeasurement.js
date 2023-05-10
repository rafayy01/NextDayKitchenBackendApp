const router = require("express").Router();
const MealMeasurementModal = require("../../models/lookups/MealMeasurement");


router.post("/add",async(req,res)=>{
    const {mealmeasurement} = req.body;
    if(!mealmeasurement){
        res.status(422).json("plz fill the data");
    }
    try {
        const premealmeasurement = await MealMeasurementModal.findOne({mealmeasurement:mealmeasurement});
        console.log(premealmeasurement);

        if(premealmeasurement){
            res.status(422).json("this Measurement Meal already present");
        }else{
            const addMeasurementMeal = new MealMeasurementModal({
                mealmeasurement
            });
            await addMeasurementMeal.save();
            
            res.status(201).json(addMeasurementMeal);
            console.log(addMeasurementMeal);
        }

    } catch (error) {
        res.status(422).json(error);
    }
})


// get All Measurement Meal List

router.get("/getAll",async(req,res)=>{
    try {
        const measurementList = await MealMeasurementModal.find();
        res.status(201).json(measurementList)
    } catch (error) {
        res.status(422).json(error);
    }
})

// get individual Measurement Meal

router.get("/getMesurement/:id",async(req,res)=>{
    try {
        console.log(req.params);
        const {id} = req.params;

        const singleMeasurementUnit = await MealMeasurementModal.findById({_id:id});
        console.log(singleMeasurementUnit);
        res.status(201).json(singleMeasurementUnit)

    } catch (error) {
        res.status(422).json(error);
    }
})


// update Measurement Meal list data
router.patch("/update/:id",async(req,res)=>{
    try {
        const {id} = req.params;

        const updateMeasurementMeal = await MealMeasurementModal.findByIdAndUpdate(id,req.body,{
            new:true
        });

        console.log(updateMeasurementMeal);
        res.status(201).json(updateMeasurementMeal);

    } catch (error) {
        res.status(422).json(error);
    }
})


// delete Measurement Meal
router.delete("/delete/:id",async(req,res)=>{
    try {
        const {id} = req.params;

        const deleteMeasurementMeal = await MealMeasurementModal.findByIdAndDelete({_id:id})
        console.log(deleteMeasurementMeal);
        res.status(201).json("Record has been Deleted Successfully");

    } catch (error) {
        res.status(422).json(error);
    }
})

module.exports = router;