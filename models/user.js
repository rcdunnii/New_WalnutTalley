// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var Schema   = mongoose.Schema;

// define the schema for our user model
var userSchema = new Schema({
    // _id              : Schema.ObjectId, -- let mongo fill this in
    local            : {        
        email        : String,
        password     : String,
        resetPasswordToken: { type : String, required : false },
        resetPasswordExpires: {type : Date, required : false }
    },
    facebook         : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },
    twitter          : {
        id           : String,
        token        : String,
        displayName  : String,
        username     : String
    },
    google           : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    }

});

// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};


// create the model for users and expose it to our app
Users = mongoose.model('Users', userSchema); 
module.exports = Users;
