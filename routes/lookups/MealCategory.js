const router = require("express").Router();
const CategoryList = require("../../models/lookups/MealCategory");


router.post("/add",async(req,res)=>{
    const {categoryName} = req.body;
    if(!categoryName){
        res.status(422).json("plz fill the data");
    }
    try {
        const premealCategory = await CategoryList.findOne({categoryName:categoryName});
        console.log(premealCategory);

        if(premealCategory){
            res.status(422).json("this Category already present");
        }else{
            const addCategory = new CategoryList({
                categoryName
            });
            await addCategory.save();
            
            res.status(201).json(addCategory);
            console.log(addCategory);
        }

    } catch (error) {
        res.status(422).json(error);
    }
})


// get AllCategorylist

router.get("/getAll",async(req,res)=>{
    try {
        const categoryList = await CategoryList.find();
        res.status(201).json(categoryList)
    } catch (error) {
        res.status(422).json(error);
    }
})

// get individual Category

router.get("/getcategory/:id",async(req,res)=>{
    try {
        console.log(req.params);
        const {id} = req.params;

        const singleCategory = await CategoryList.findById({_id:id});
        console.log(singleCategory);
        res.status(201).json(singleCategory)

    } catch (error) {
        res.status(422).json(error);
    }
})


// update Category list data
router.patch("/update/:id",async(req,res)=>{
    try {
        const {id} = req.params;

        const updateCategory = await CategoryList.findByIdAndUpdate(id,req.body,{
            new:true
        });

        console.log(updateCategory);
        res.status(201).json(updateCategory);

    } catch (error) {
        res.status(422).json(error);
    }
})


// delete Category
router.delete("/delete/:id",async(req,res)=>{
    try {
        const {id} = req.params;

        const deletecategory = await CategoryList.findByIdAndDelete({_id:id})
        console.log(deletecategory);
        res.status(201).json("Record has been Deleted Successfully");

    } catch (error) {
        res.status(422).json(error);
    }
})




module.exports = router;










