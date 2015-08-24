var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var contactsSchema = new Schema({    
     "_id": Schema.ObjectId,
    "walnutID": String,
    "visibility": { type : Boolean, default : true },
    "SirName"   : { type : String, required : false },
    "Names": String,
    "FormalNames": String,
    "Children": String,
    "Address" :  {type : Array, default : []},   
    "Email"   :  {type : Array, default : []}, 
    "Phone"   :  {type : Array, default : []},      
    "Notes"   : String,
    "Created" : Date,
    "Updated" : Date     
},{collection : 'contacts'});

// create the model for contacts and expose it to our app
Contacts = mongoose.model('Contacts', contactsSchema);
module.exports = Contacts;
