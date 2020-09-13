// set up ======================================================================
// get all the tools we need
// include and initialize the rollbar library with your access token
var Rollbar = require('rollbar')
var rollbar = new Rollbar({
  accessToken: '65b032e385ca43f0910589aba23d39d8',
  captureUncaught: true,
  captureUnhandledRejections: true
})

// record a generic message and send it to Rollbar
rollbar.log('Hello world!')

const configs = require('./conf/config.js')
const express = require('express')
var path = require('path')
var app = express()
const favicon = require('serve-favicon')
const mongoose = require('mongoose')
var passport = require('passport')
// var crypto = require('crypto') // installed with node
// const { DH_NOT_SUITABLE_GENERATOR } = require('constants') // installed with node
// var LocalStrategy = require('passport-local').Strategy
var flash = require('connect-flash')
var morgan = require('morgan')
var winston = require('./conf/winston')
var cookieParser = require('cookie-parser')
// var bodyParser = require('body-parser')
const session = require('express-session')

// Package documentation - https://www.npmjs.com/package/connect-mongo
// const MongoStore = require('connect-mongo')(session)

// configuration ===============================================================

// record a generic message and send it to Rollbar
var configDB = require('./conf/database.js')

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const connection = mongoose.createConnection(configDB.url, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}
  .then(() => { console.log('Connected up to the mongodb') })
  .catch(err => { console.error(err) })
)
/* alternate way to do the above
connection.on('connecting', () => {
    console.log('connected');
});
*/
/*
mongoose.connect(configDB.url, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }, function(err)  {
    if (err) {
           console.error(err);
        }
    else {
           console.log("Connected up to the mongodb");
       }
});
*/

require('./conf/passport')(passport) // pass passport for configuration

// set up our express application
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')))
app.use(morgan('combined', { stream: winston.stream }))
app.use(cookieParser()) // read cookies (needed for auth)
// app.use(bodyParser.json()); // get information from html forms
// app.use(bodyParser.urlencoded({ extended: true }));

// view engine setup

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs') // set up ejs for templating

app.use(express.static(path.join(__dirname, 'public')))

// required for passport
app.use(session({ secret: 'ilovescotchscotchyscotchscotch', cookie: { secure: false }, resave: true, saveUninitialized: true })) // session secret
app.use(passport.initialize())
app.use(passport.session()) // persistent login sessions
app.use(flash()) // use connect-flash for flash messages stored in session

var routes = require('./routes/routeNut.js')(app, passport) // load our routes and pass in our app and fully configured passport

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found')
  err.status = 404
  next(err)
})

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500)
    res.render('error', {
      title: 'Error Page',
      message: err.message,
      error: err
    })
  })
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500)
  res.render('error', {
    title: 'Error Page',
    message: err.message,
    error: {}
  })
})

// launch ======================================================================

app.listen(configs.myPort, '127.0.0.1')
var ts = new Date()
console.log('The magic happens on port ' + configs.myPort + ' Time: ' + ts.toISOString())

module.exports = app
