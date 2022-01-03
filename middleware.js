const Recipe = require('./models/recipe')
const Review = require('./models/review');
const ExpressError = require('./utils/ExpressError');
const {recipeSchema, reviewSchema} = require('./schemas');
const user = require('./models/user');

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) { // isAuthenticated is automatically added to the req object from passport
        req.session.returnTo = req.originalUrl; // Creating a returnTo on the session object for redirecting after login
        req.flash('error', 'You must be logged in');
         return res.redirect('/login');
    }
    next();
}

module.exports.isAuthor = async(req, res, next) => {
    const {id} = req.params;
    const recipe = await Recipe.findById(id);
    if (recipe.author.equals(req.user._id) || req.user.isAdmin) {
        next();
    } else {
        req.flash('error', 'You do not have permission to do that');
        return res.redirect(`/recipe/${id}`);
    }
}

module.exports.isReviewAuthor = async(req, res, next) => {
    const {id, reviewId} = req.params;
    const review = await Review.findById(reviewId)
    if (review.author.equals(req.user._id) || req.user.isAdmin) {
        next();
    } else {
        req.flash('error', 'You do not have permission to do that');
        return res.redirect(`/recipe/${id}`);
    }
}

module.exports.validateRecipe = (req, res, next) => {
    const {error} = recipeSchema.validate(req.body); // validate is a function from Joi
    if(error){
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 404)
    } else {
        next();
        }
}

module.exports.validateReview = (req, res, next) => {
    const {error} = reviewSchema.validate(req.body);
    if(error){
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 404)
    } else {
    next();
    }
}