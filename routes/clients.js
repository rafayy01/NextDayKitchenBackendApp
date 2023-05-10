const router = require("express").Router();
const clients = require("../models/client");


router.post("/addclient",async(req,res)=>{

    const {clientId,clientName,phoneNumber} = req.body;
    
    if(!clientId || !clientName || !phoneNumber){
        res.status(422).json("Kindly fill all fields!");
        
    }
    try {
        
        const preuser= await clients.findOne({clientId:clientId, phoneNumber:phoneNumber});

        console.log(preuser);

        if(preuser){
            res.status(422).json("this phone number or id is already present");
        }else{
            const addclient = new clients(req.body);
            await addclient.save();
            res.status(201).json(addclient);
            console.log(addclient);
        }

    } catch (error) {
        res.status(422).json(error);
    }
})


// get Alluserlist

router.get("/getallclients",async(req,res)=>{
    try {
        const clientsList = await clients.find();
        res.status(201).json(clientsList)
    } catch (error) {
        res.status(422).json(error);
    }
})

// get individual user

router.get("/getclient/:id",async(req,res)=>{
    try {
        console.log(req.params);
        const {id} = req.params;

        const client = await clients.findById({_id:id});
        console.log(client);
        res.status(201).json(client)

    } catch (error) {
        res.status(422).json(error);
    }
})

// router.get("/getclient/:phoneNumber",async(req,res)=>{
//     try {
//         console.log(req.params);
//         const {id} = req.params;

//         const client = await clients.findById({id:id});
//         console.log(client);
//         res.status(201).json(client)

//     } catch (error) {
//         res.status(422).json(error);
//     }
// })


// update user data
router.patch("/updateclient/:id",async(req,res)=>{
    try {
        const {id} = req.params;

        const updateduser = await clients.findByIdAndUpdate(id,req.body,{
            new:true
        });

        console.log(updateduser);
        res.status(201).json(updateduser);

    } catch (error) {
        res.status(422).json(error);
    }
})


// delete user
router.delete("/deleteclient/:id",async(req,res)=>{
    try {
        const {id} = req.params;

        const deletclient = await clients.findByIdAndDelete({_id:id})
        console.log(deletclient);
        res.status(201).json(deletclient);

    } catch (error) {
        res.status(422).json(error);
    }
})




module.exports = router;










