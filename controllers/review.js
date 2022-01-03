const Review = require('../models/review');
const Recipe = require('../models/recipe');
const expresserror = require('../utils/ExpressError');

module.exports.createReview = async(req, res) => {
    const recipe = await Recipe.findById(req.params.id);
    const review = new Review(req.body.review);
    review.author = req.user._id;
    // Pushing onto our reviews array in our recipe model
    recipe.reviews.push(review);
    await review.save();
    await recipe.save();
    req.flash('success', "Successfully posted a new review!")
    res.redirect(`/recipe/${recipe._id}`);
};

module.exports.deleteReview = async(req, res) => {
    const { id, reviewId } = req.params;
    // $pull is a mongo operator that removes an element from an array
    // This operator will pull the element "reviewId" out of the "reviews" array
    await Recipe.findByIdAndUpdate(id, {$pull: {reviews: reviewId}})
    await Review.findByIdAndDelete(reviewId);
    res.redirect(`/recipe/${id}`);
};