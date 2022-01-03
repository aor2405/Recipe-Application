const Recipe = require('../models/recipe');
const { cloudinary } = require('../cloudinary/index')
const expresserror = require('../utils/ExpressError');
const nodemailer = require("nodemailer");

// This is a Controller of our MVC pattern

// Displays all recipes and includes the search function results
module.exports.index = async(req, res) => {
    const recipes = await Recipe.find({});
    if(req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Recipe.find({title: regex}, function(err, allRecipes) {
            if(err) {
                console.log(err)
            } else {
                if(allRecipes.length === 0 ) {
                    req.flash('error', 'No recipe found, please try another recipe')
                    return res.redirect('/recipe');
                }
                res.render('recipe/index', { recipes: allRecipes })
            }
        })
    } else {
        res.render('recipe/index', { recipes })
    }
};  

module.exports.contact = async(req, res) => {
    res.render('recipe/contact')
}

module.exports.sendContact = (req, res) => {
    const name = req.body.txtName;
    const sender = req.body.txtEmail;
    const enquiry = req.body.txtMsg;
    const phone = req.body.txtPhone
    const output = `
        <h4>From: ${sender}</h4> 
        <h4>Name: ${name} </h4>
        <h4>Phone Number: ${phone}</h4>
        <p><b>Message:</b> ${enquiry}</p> 
    `
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'recipe2022@gmail.com',
      pass: process.env.GMAILPW
    }
  });

  const emailOptions = {
    from: `${sender}`,
    to: 'recipe2022@gmail.com',
    subject: 'Recipe.ie Enquiry',
    html: output
  };

  transporter.sendMail(emailOptions, (err, info) => {
    if (err) {
        req.flash('error', `There was an error, please try again. ${err}`)
        res.redirect('/contact');
    } else {
      console.log('Message Sent: ' + info.response);
      console.log('Email Message: ' + emailMessage);
    }
  });
    req.flash('success', 'Enquiry submitted!')
    res.redirect('/recipe');
};

module.exports.renderNewForm = (req, res) => {
    res.render('recipe/new');
};

module.exports.createRecipe = async(req, res, next) => {
    const recipe = new Recipe(req.body.recipe); // Creating a new recipe with the data from our form submission
    // Mapping over the array that has been added to req.files from Multer. we are taking path and filename and creating a 
    // new object for each one and out that in an array and we add that on to recipe that we initalized above
    recipe.images = req.files.map(f => ({url: f.path, filename: f.filename}))
    recipe.author = req.user._id; // Adding an author Id for authorization
    await recipe.save();
    // This message is stored inside of req.flash with the key "success" once a new page has been created
    req.flash('success', 'Successfully made a new recipe!')
    // This will redirect us to the new recipe we just created 
    res.redirect(`/recipe/${recipe._id}`)
};

module.exports.showRecipe = async(req, res) => {
    const recipe = await Recipe.findById(req.params.id).populate({
        path: 'reviews', 
        populate: {
            path: 'author'
    }
}).populate('author');
    if(!recipe) {
        req.flash('error', 'Cannot find this recipe!')
        return res.redirect('/recipe');
    }
    res.render('recipe/show', { recipe })
};

module.exports.renderEditForm = (async(req, res) => {
    const {id} = req.params;
    const recipe = await Recipe.findById(id);
    if(!recipe) {
        req.flash('error', 'Cannot find this recipe!')
        return res.redirect('/recipe');
    }
    res.render('recipe/edit', { recipe });
});

module.exports.updateRecipe = async(req, res) => {
    const {id} = req.params;
    const recipe = await Recipe.findByIdAndUpdate(id, {...req.body.recipe});
    const imgs = req.files.map(f => ({url: f.path, filename: f.filename}));
    recipe.images.push(...imgs);
    await recipe.save();
    if (req.body.deleteImages) {  // If there is any elements in the deleteImages array passed in from the edit.ejs form
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename); // This will delete the selected images from cloudinary
        }
        // This will pull an element out of our images array where our filename is in req.body.deleteImages
        await recipe.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } })
    }
    req.flash('success', "Sucessfully updated recipe!")
    res.redirect(`/recipe/${recipe.id}`)
};

module.exports.deleteRecipe =  async(req, res) => {
    const { id } = req.params;
    await Recipe.findByIdAndDelete(id);
    res.redirect('/recipe');
};

// This function is for the fuzzy search
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};
