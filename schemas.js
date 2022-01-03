const { sanitize } = require('express-mongo-sanitize');
const baseJoi = require('joi');
const sanitizeHTML = require('sanitize-html')
const { validateRecipe } = require('./middleware');

// Joi is used for validating js ogjects for Schemas. It creates an extension thaat allows use to use '.numer().required().min(1)'.
// This will be used as a security measure against  a cross site scripting attack

// Defining our own Joi extension
const extension = (joi) => ({
    type: 'string',
    base: joi.string(),
    messages: {
        'string.escapeHTML': '{{#label}} must not include HTML'
    },
    rules: {
        escapeHTML: {
            validate(value, helpers) {
                const clean = sanitizeHTML(value, {
                    allowedTags: [],
                    allowedAttributes: {}
                });
                if (clean !== value) return helpers.error('string.escapeHTML', {value})
                return clean;
            }
        }
    }
});

const Joi = baseJoi.extend(extension) // Adding this new extension to our base Joi below

module.exports.recipeSchema  = Joi.object ({
    recipe: Joi.object({
        title: Joi.string().required().escapeHTML(),
        description: Joi.string().required().escapeHTML(),
        ingredients: Joi.string().required(),
        method: Joi.string().required()
    }).required(),
    deleteImages: Joi.array()
});

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(1).max(5),
        body: Joi.string().required().escapeHTML()
    }).required()
});
