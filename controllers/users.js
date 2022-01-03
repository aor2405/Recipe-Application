const User = require('../models/user');
const Recipe = require('../models/recipe');

const async = require('async');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Creating a user
module.exports.renderRegister = (req, res) => {
	res.render('user/register');
};

module.exports.register = async (req, res, next) => {
	try {
		const { email, username, password, firstName, lastName, avatar, admincode } = req.body;
		let user = new User({ email, username, firstName, lastName, avatar, admincode });
		if (user.admincode === process.env.ADMINPW) {
			user.isAdmin = true;
		}
		// This will take the new instance of a user we just created and place the hashed password to it with '.register'
		const registeredUser = await User.register(user, password);
		req.login(registeredUser, (err) => {
			// Passing in registered user to our login method in our req object from passport
			if (err) return next(err);
			req.flash('success', 'Welcome to Recipes!');
			res.redirect('/recipe');
		});
	} catch (err) {
		req.flash('error', err.message);
		res.redirect('/register');
	}
};

// User login
module.exports.renderLogin = (req, res) => {
	res.render('user/login');
};

module.exports.login = (req, res) => {
	// Will eneter into the body of this function if the user has been authenticated
	req.flash('success', 'Welcome back!');
	const redirectUrl = req.session.returnTo || '/recipe'; // Default to '/recipe' if there is no returnTo on the session object from the middleware file
	delete req.session.returnTo;
	res.redirect(redirectUrl);
};

// User logout
module.exports.logout = (req, res) => {
	req.logout(); // Automatically added to our req object from passport
	req.flash('success', 'Goodbye!');
	res.redirect('/recipe');
};

module.exports.profile = (req, res) => {
	User.findById(req.params.id, function(err, foundUser) {
		if (err) {
			req.flash('error', 'Profile not found');
			res.redirect('/');
		}
		Recipe.find({ author: foundUser }, function(err, allRecipes) {
			if (err) {
				req.flash('error', 'Profile not found');
				res.redirect('/');
			}
			res.render('user/profile', { user: foundUser, recipes: allRecipes }); // Passing in our user: foundUser object to our views/user/profile page
		});
	});
};

// Reset password
module.exports.renderForgotForm = (req, res) => {
	res.render('user/forgot');
};

module.exports.sendForgotForm = (req, res, next) => {
	async.waterfall(
		[
			function(done) {
				crypto.randomBytes(20, function(err, buf) {
					const token = buf.toString('hex'); // Generating our token that will be sent as part of the url for the PW reset
					done(err, token);
				});
			},
			function(token, done) {
				User.findOne({ email: req.body.email }, function(err, user) {
					if (!user) {
						req.flash('error', 'No account with that email address exists.');
						return res.redirect('/forgot');
					}

					user.resetPasswordToken = token;
					user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

					user.save(function(err) {
						done(err, token, user);
					});
				});
			},
			function(token, user, done) {
				const smtpTransport = nodemailer.createTransport({
					service: 'gmail',
					auth: {
						user: 'recipe2022@gmail.com',
						pass: process.env.GMAILPW
					}
				});
				const mailOptions = {
					to: user.email,
					from: 'recipe2022@gmail.com',
					subject: 'Node.js Password Reset',
					text:
						'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
						'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
						'http://' +
						req.headers.host +
						'/reset/' +
						token +
						'\n\n' +
						'If you did not request this, please ignore this email and your password will remain unchanged.\n'
				};
				smtpTransport.sendMail(mailOptions, function(err) {
					console.log('mail sent');
					req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
					done(err, 'done');
				});
			}
		],
		function(err) {
			if (err) return next(err);
			res.redirect('/forgot');
		}
	);
};

module.exports.renderReset = (req, res) => {
	User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(
		err,
		user
	) {
		if (!user) {
			req.flash('error', 'Password reset token is invalid or has expired!');
			return res.redirect('user/forgot');
		}
		res.render('user/reset', { token: req.params.token });
	});
};

module.exports.sendResetPassword = (req, res) => {
	async.waterfall(
		[
			function(done) {
				User.findOne(
					{ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } },
					function(err, user) {
						if (!user) {
							req.flash('error', 'Password reset token is invalid or has expired.');
							return res.redirect('back');
						}
						if (req.body.password === req.body.confirm) {
							user.setPassword(req.body.password, function(err) {
								user.resetPasswordToken = undefined; // Resetting the token
								user.resetPasswordExpires = undefined;

								user.save(function(err) {
									// Updating the user
									req.logIn(user, function(err) {
										done(err, user);
									});
								});
							});
						} else {
							req.flash('error', 'Passwords do not match.');
							return res.redirect('back');
						}
					}
				);
			},
			function(user, done) {
				const smtpTransport = nodemailer.createTransport({
					service: 'gmail',
					auth: {
						user: 'recipe2022@gmail.com',
						pass: process.env.GMAILPW
					}
				});
				const mailOptions = {
					to: user.email,
					from: 'recipe2022@gmail.com',
					subject: 'Your password has been changed',
					text:
						'Hello,\n\n' +
						'This is a confirmation that the password for your account ' +
						user.email +
						' has just been changed.\n'
				};
				smtpTransport.sendMail(mailOptions, function(err) {
					req.flash('success', 'Success! Your password has been changed.');
					done(err);
				});
			}
		],
		function(err) {
			res.redirect('/recipe');
		}
	);
};
