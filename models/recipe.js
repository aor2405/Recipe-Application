const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// This is a Model of our MVC pattern

const RecipeSchema = new Schema ({
    title: String,
    description: String,
    ingredients: String,
    method: String,
    createdAt: { type: Date, default: Date.now },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ],
    images: [
        {
            url: String,
            filename: String
        }
    ]
});

module.exports = mongoose.model('Recipe', RecipeSchema);