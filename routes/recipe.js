const express = require('express');
const router = express.Router();
const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });

const recipe = require('../controllers/recipe');
const catchAsync = require('../utils/catchAsync');
const {isLoggedIn, isAuthor, validateRecipe} = require('../middleware');

// Calling to all of our routes in the controllers folder.

router.route('/')
    .get(catchAsync(recipe.index)) // Display all recipes and Search functionality
    .post(upload.array('image'), isLoggedIn, validateRecipe, catchAsync(recipe.createRecipe));  // Used for uploading image

// Create new recipe
router.get('/new', isLoggedIn, (recipe.renderNewForm));

// Contact page
router.route('/contact')
    .get(recipe.contact)
    .post(recipe.sendContact)

router.route('/:id')
    .get(catchAsync(recipe.showRecipe)) // Display a single recipe
    .put(isLoggedIn, isAuthor, upload.array('image'), validateRecipe, catchAsync(recipe.updateRecipe)) // Updating a recipe
    .delete(isLoggedIn, isAuthor, catchAsync(recipe.deleteRecipe)); // Delete a recipe

// Edit a recipe
router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(recipe.renderEditForm));


module.exports = router;

