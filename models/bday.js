// load the things we need
var mongoose = require('mongoose');

// define the schema for our user model
var Schema = mongoose.Schema;

 var BdaySchema = new Schema ({
     "FirstName": String,
     "MiddleInit": String,
     "LastName": String,
     "bDayYYYY": String,
     "bDayMM": String,
     "bDayDD": String,
}, {collection : 'bdays'});

// create the model for Bday and expose it to our app
Bdays = mongoose.model('Bdays', BdaySchema);
module.exports = Bdays;

