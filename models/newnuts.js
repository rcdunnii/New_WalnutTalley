var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var newnutsSchema = new Schema({    
     "_id": Schema.ObjectId,
    "walnutID": String,
    "visibility": { type : Boolean, default : true },
    "SirName": { type : String, required : false },
    "Names": String,
    "FormalNames": String,
    "Children": String,
    "Address" : 
      [ {"_id": Schema.ObjectId},  
         {   
           "street"         : String,         
           "city"          : String,
           "state"         : String,
           "country"       : String,
           "zip"           : String
        }        
      ],       
    "Email" :
      [ {"_id": Schema.ObjectId},      
        {"email" : String }              
      ],
    "Phone"  :
      [ {"_id": Schema.ObjectId},
        {"phone" : String}            
      ],
    "Notes": String,
    "Created": Date,
    "Updated": Date     
},{collection : 'newnuts'});

// create the model for contacts and expose it to our app
Newnuts = mongoose.model('Newnuts', newnutsSchema);
module.exports = Newnuts;
