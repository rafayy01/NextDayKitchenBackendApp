const router = require("express").Router();
const Subscription = require("../models/subscription");


router.post("/addonesubscription", async (req, res) => {
  const {
    clientId,
    targetProtien,
    targetCalories,
    date
  } = req.body;

  try {
    const PreSubscription = await Subscription.findOne({ clientId: clientId, date:date });
    if (PreSubscription) {
      res.status(422).send({ error: "Client has an entry on this date" });
    } else {
      const addSubscription = new Subscription(req.body);
      await addSubscription.save();
      res.status(201).json(addSubscription);
    }
  } catch (error) {
    res.status(422).json({ error: error });
  }
});

router.post("/addbulksubscriptions", async (req, res) => {
  const {
    requestedClientId,
    subscriptions
  } = req.body;

  try {
    // function addOneDay(date) {
    //   date.setDate(date.getDate() + 5);
    //   return date;
    // }


    const duplicateSubs = []
    const clientActiveSubs = await Subscription.find({clientId: requestedClientId})
    const clientActivedates = clientActiveSubs.map(item=> {
      return  item.date.getFullYear()+ "-" + (item.date.getMonth()+1) + "-" + item.date.getDate()
    })
   
    const requestedDates = subscriptions.map(item => {
      return item.date
    })

    for (let i = 0; i < clientActiveSubs.length; i++) {
      if(requestedDates.includes(clientActivedates[i]) ){
        duplicateSubs.push(clientActiveSubs[i])
      }
    }


    if(duplicateSubs.length !==0){
      console.log("overlap: "+ duplicateSubs)
      res.status(422).json({error: duplicateSubs});
    } else {
      for (oneSub in subscriptions){
        const addSubscription = new Subscription({clientId: requestedClientId, targetProtien: subscriptions[oneSub].targetProtien, targetCalories: subscriptions[oneSub].targetCalories,
        date: subscriptions[oneSub].date, categories: subscriptions[oneSub].categories });
        const added = await addSubscription.save();
        const categoriesAdded = await added.update(
          { $addToSet: { categories: subscriptions[oneSub].categories } },
          { new: true })
        console.log("this is number:  " + oneSub + "  and value:  " + added + "categories added:  " + categoriesAdded)
        
      }
      res.status(201).json(subscriptions);
    }

  } catch (error) {
    res.status(422).json({ error: error });
  }
});


// delete Subscription
router.delete("/deleteSubscription/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deleteSubscription = await Subscription.findByIdAndDelete({ _id: id });
    console.log(id);
    if (deleteSubscription) {
      res.status(201).json("Subscription deleted Successfully");
    } else {
      res.status(402).send({ error: "ID Can't be found" });
    }
  } catch (error) {
    res.status(422).send({ error: "can't find id" });
  }
});

//getAllSubscriptions
router.get("/getAllSubscriptions", async (req, res) => {
  try {
    const subscriptionsList = await Subscription.find();
    res.status(201).json(subscriptionsList);
  } catch (error) {
    res.status(422).json(error);
  }
});

// get one subsctiption
router.get("/getSubscription/:id", async (req, res) => {
  try {
    console.log(req.params);
    const oneSubscription = await Subscription.findById(req.params.id);
    res.status(201).send(oneSubscription);
  } catch (error) {
    res.status(422).json(error);
  }
});

//get Subscriptions for one clint
router.get("/getclientsubscriptions/:clientId", async (req, res) => {
  try {
    clientId = req.params.clientId
    const clientSubs =  (await Subscription.find()).filter(item => item.clientId == clientId)
    res.status(201).send(clientSubs);
  } catch (error) {
    res.status(422).json(error);
  }
});

// update subsctiption
router.patch("/updateSubscription/:id", async (req, res) => {
  try {
    const updatedSubscription = await Subscription.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.status(201).json(updatedSubscription);
  } catch (error) {
    res.status(422).json(error);
  }
});

// CATEGORIES MANAGEMENT APIs

//addCategory
router.put("/addcategory/:id", async (req, res) => {
  try {
    const subscriptionId = req.params.id;
    const { categories } = req.body;
    console.log("first:  " + {categories})
    const oneSubscription = await Subscription.findById({ _id: subscriptionId });

    if (oneSubscription) {
        const subscriptionCategory = await Subscription.findByIdAndUpdate(
          subscriptionId,
          { $addToSet: { categories: categories } },
          { new: true }
        );
        res.status(201).send(subscriptionCategory);

    } else {
      res.status(402).send({ error: "ID Can't be found" });
    }
  } catch (error) {
    res.status(422).json(error);
  }
});


router.delete("/deletecategory/:id", async (req, res) => {
  try {
    const subscriptionId = req.params.id;
    const {categoryId} = req.body;

        Subscription.findOne({ _id: subscriptionId}, (error, doc) => {
          if (error) {
            console.log(error);
          } else {
            doc.categories.pull(categoryId);
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
