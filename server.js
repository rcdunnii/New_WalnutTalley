// set up ======================================================================
// get all the tools we need
var express  = require('express');
var path     = require('path');
var app      = express();


var port     = process.env.PORT || 8080;
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
//var OAuth2Strategy = require('passport-oauth').OAuth2Strategy;
var flash    = require('connect-flash');
//var flash = require('express-flash');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');
//var routes       = require('./routes/routeNut.js');
//var users        = require('./routes/users');
var configDB     = require('./config/database.js');

// configuration ===============================================================
mongoose.connect(configDB.url); // connect to our database
//mongoose.connect('mongodb://127.0.0.1:27017');
require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));



// view engine setup

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs'); // set up ejs for templating

app.use(express.static(path.join(__dirname, 'public')));

// required for passport
app.use(session({ secret: 'ilovescotchscotchyscotchscotch', cookie : { secure : false} } )); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// routes ======================================================================
    
// require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport
var users = require('./routes/users');
var routes = require('./routes/routeNut.js')(app, passport); // load our routes and pass in our app and fully configured passport

//var dotenv = require('dotenv');
//dotenv.load();
var nconf = require('nconf');
nconf.argv()
     .env()
     .file({ file:
       process.env.NODE_ENV + '.json'
});       
    
// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
        	title : "Error Page",
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);    
    res.render('error', {
    	title : "Error Page",
        message: err.message,
        error: {}
    });
});


// launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port);


module.exports = app;