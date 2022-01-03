if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}

// console.log(process.env.SECRET)

const express = require('express');
const path = require('path');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const moment = require('moment');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');

const User = require('./models/user');
const recipeRouter = require('./routes/recipe');
const userRouter = require('./routes/users');
const reviewRouter = require('./routes/reviews');
const ExpressError = require('./utils/ExpressError');
const { Console } = require('console');

mongoose.connect('mongodb://localHost:27017/recipe', {
	// Creating and then connecting to a database called 'recipe'
	useNewUrlParser: true,
	useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:')); // checking for an error, will print 'connection error' if found
db.once('open', () => {
	// Checking for a success, will print "Database connected if found"
	console.log('Database connected');
});

const app = express();

app.set('view engine', 'ejs'); // requires ejs
app.set('views', path.join(__dirname, 'views')); // sets path to views for templates
app.engine('ejs', ejsMate); // Allows access to ejs templating

app.use(express.static(path.join(__dirname, 'public'))); // Gives us access to the public folder
app.use(express.urlencoded({ extended: true })); // Used to parse the data for the 'req.body'
app.use(methodOverride('_method')); // Allows use to send a PUT request to express
app.use(mongoSanitize()); // This will prevent mongo injections to prevent security exploits

const sessionConfig = {
	name: 'session',
	secret: 'thisshouldbeabettersecret',
	resave: false,
	saveUninitialized: true,
	cookie: {
		httpOnly: true,
		// secure: true,
		expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
		maxAge: 1000 * 60 * 60 * 24 * 7
	}
};

app.use(session(sessionConfig));
app.use(flash());
app.use(helmet()); // Helps secure HTTP headers returned by our app

// Configuring Helmet below
const scriptSrcUrls = [
	'https://stackpath.bootstrapcdn.com/',
	'https://kit.fontawesome.com/',
	'https://cdnjs.cloudflare.com/',
	'https://cdn.jsdelivr.net'
];
//This is the array that needs added to
const styleSrcUrls = [
	'https://kit-free.fontawesome.com/',
	'https://use.fontawesome.com/',
	'https://cdn.jsdelivr.net'
];
const connectSrcUrls = [];
const fontSrcUrls = [];
app.use(
	helmet.contentSecurityPolicy({
		directives: {
			defaultSrc: [],
			connectSrc: [ "'self'", ...connectSrcUrls ],
			scriptSrc: [ "'unsafe-inline'", "'self'", ...scriptSrcUrls ],
			styleSrc: [ "'self'", "'unsafe-inline'", ...styleSrcUrls ],
			workerSrc: [ "'self'", 'blob:' ],
			objectSrc: [],
			imgSrc: [
				"'self'",
				'blob:',
				'data:',
				'https://res.cloudinary.com/dd2duttda/', //SHOULD MATCH YOUR CLOUDINARY ACCOUNT!
				'https://images.unsplash.com/'
			],
			fontSrc: [ "'self'", ...fontSrcUrls ]
		}
	})
);

app.locals.moment = require('moment'); // Time feature used for displaying when a recipe was posted
app.use(passport.initialize()); // Used to initalize passport
app.use(passport.session()); // Used for presistent login sessions, making sure we don't have to login on every single request
// We will use the LocalStrategy, and for this strategy, we will use the authentication method that will be located on our
// user model and its called 'authenticate' that is automatically added from passport-local-mongoose
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser()); // How to store user in the session
passport.deserializeUser(User.deserializeUser()); // How to get a user out of that session

// This middleware will run on every request and pass in whatever is in flash under success
app.use((req, res, next) => {
	// Passport automatically adds 'user' to the request object. The information is store in the session
	// and passport takes this and deserializes it and fills in req.user with this data
	res.locals.currentUser = req.user; //This will give all our templates access to 'req.user'
	res.locals.success = req.flash('success'); // This will give us access to flash(success) in our templates under the key success
	res.locals.error = req.flash('error');
	next();
});

app.use('/recipe', recipeRouter);
app.use('/', userRouter);
app.use('/recipe/:id/reviews', reviewRouter);

app.get('/home', (req, res) => {
	res.render('home');
});

app.all('*', (req, res, next) => {
	next(new ExpressError('Page not found you', 404));
});

app.use((err, req, res, next) => {
	const { statusCode = 500 } = err;
	if (!err.message) err.message = 'Oh No, Something Went Wrong!';
	res.status(statusCode).render('error', { err });
});

app.listen(3000, () => {
	console.log('Listening on port 3000');
});
