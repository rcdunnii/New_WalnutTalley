// open original database
// create new database
// read each original entry
// write new entry
// close all

// Retrieve
var MongoClient1 = require('mongodb').MongoClient;
// var MongoClient2 = require('mongodb').MongoClient;

// Connect to the dbs
MongoClient1.connect("mongodb://walnut:wRYTYBWs06VKYNuHP0UP@ds027751.mongolab.com:27751/chestnuts", function(err, db1) {
  if(!err) {
    console.log("We are connected to chestnuts");
  }
});

MongoClient1.connect("mongodb://newwalnut:p6YZNb4Fkc@ds029801.mongolab.com:29801/newchestnuts", function(err, db2) {
  if(!err) {
    console.log("We are connected to newchestnuts");
  }
});

 MongoClient1.close( function(err) {
 	if (!err) {console.log("We are disconnected from databases");
 	}
 });