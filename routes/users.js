const express = require('express');
const router = express.Router();
const passport = require('passport');
const catchAsync = require('../Utils/catchAsync');
const user = require('../controllers/users')
const {isLoggedIn, isAuthor, validateRecipe} = require('../middleware');

router.route('/register')
    .get(user.renderRegister)
    .post(catchAsync(user.register));

router.route('/login')
    .get(user.renderLogin)  
    // Using the built-in passport middleware, using the 'local' strategy
    // If there is a failure, flash the error message and redirect you to login
    .post(passport.authenticate('local', {failureFlash: true, failureRedirect: '/login'}), (user.login));

router.get('/user/:id', (user.profile));

router.get('/logout', (user.logout));

router.route('/forgot')
    .get(user.renderForgotForm)
    .post(user.sendForgotForm);

router.route('/reset/:token')
    .get(user.renderReset)
    .post(user.sendResetPassword);

module.exports = router;