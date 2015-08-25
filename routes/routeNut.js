module.exports    = function(app, passport) {
var mongoose      = require('mongoose'),
    util          = require('util'),
    ObjectID      = require('mongodb').ObjectID;
var Contacts      = require ('../models/contacts');
var myContacts    = mongoose.model('Contacts');
var Bdays         = require('../models/bday');
var myBdays       = mongoose.model('Bdays');
var Users         = require('../models/user');
var async         = require('async');
var crypto        = require('crypto');
var nodemailer    = require("nodemailer");
var mg            = require('nodemailer-mailgun-transport');
//var smtpTransport = require('nodemailer-smtp-transport');
var dotenv 		  = require('dotenv');
// load the auth variables
var configAuth = require('../config/auth'); // use this one for testing
dotenv.load();

// normal routes ===============================================================

	// show the home page (will also have our login links)
	app.get('/', function(req, res) {
		res.render('index.ejs');
	});

// MAIN SECTION =========================
//var User = require('../models/user');
    app.get('/listem', function(req, res) {
       Users.find(function(err, users) {
       	res.render('listUsers.ejs', { users: users, title : "Users"});
 	   });
    });

    app.get('/main', isLoggedIn, function(req, res) {
    	res.render('main.ejs');
    });
    
    app.get('/mainChoice', isLoggedIn, function(req, res) {	
    	var mainRequest = req.query.main;
    	console.log("in routeNuts.js handling a GET called with: " + mainRequest);
    	if (mainRequest == "listNuts") {
			myContacts.find({}, null,{sort:{SirName:1}}, function(err, nuts) {				
			    res.render('listNuts.ejs', {
				     user : req.user.local.email,
				     title : "Contact List",				    
				     nuts: nuts,
				     searching : false,
				     numNuts : nuts.length		    
			 	});
     		});
 		} else if (mainRequest =="listBdays") {
 			//mongoose.model('Bday').find({}, null, {sort:{LastName:1}}, function (err, bdays){			
 			Bdays.find({}, null, {sort:{LastName:1}}, function (err, bdays) {			 				
			    res.render('listBdays.ejs', {
				    user : req.user.local.email,
				    title : "List Birthdays",
				    bDays: bdays,
				    numBdays : bdays.length		    
	   			});
     		});
 		} else if (mainRequest =="logout") {
 			req.logout();
		    res.redirect('/');
 		} else {
 			console.log("Error line 60 in routeNut.js");
 			req.logout();
		    res.redirect('/');
 		}
    });	
	
	app.get('/profile', isLoggedIn, function(req, res) {
		res.render('profile.ejs', {
			user : req.user
		});
	});


	// following is called by onclick event on member of list of contacts which in turn calls getContact() in main.js which
	// makes ajax call here to select a document for edit; this returns the current document to ajax routine that sends the document
	// to the edit screen for editing and viewing
	app.post('/editContactRoute', function(req, res) {		
        util.log('Request received: \nmethod: ' + req.method + '\nurl: ' + req.url);// this line logs just the method and url
		var matchedContact = {};
		var editRequest = req.body.target;
		console.log("in app.post  /editContact where editRequest is " + editRequest);
		myContacts.findOne({"_id":editRequest}, function (err, matchedContact){			
			if (err) {
				console.log(err); 				
			}
			res.writeHead(200, { 
		    	'Content-Type': 'text/plain',
        	    'Access-Control-Allow-Origin': '*' });// implementation of CORS 
			res.end(JSON.stringify(matchedContact));	// add quotes to convert to string	       
		});
	 });

	 app.get('/rmContactRoute', function(req, res) {		 
        util.log('Request received: \nmethod: ' + req.method + '\nurl: ' + req.url);// this line logs just the method and url		
		var rmRequestID = req.param("target");
		var rmResult;
		myContacts.remove({_id: rmRequestID}, function (err, rmResult){			
			 if (err) {			
				res.writeHead(200, { 
		    	'Content-Type': 'text/plain',
        	    'Access-Control-Allow-Origin': '*' });// implementation of CORS 
				res.end("Failed");	// add quotes to convert to string	
			}	
			res.writeHead(200, { 
		    	 'Content-Type': 'text/plain',
         	    'Access-Control-Allow-Origin': '*' });// implementation of CORS 
			 res.end("Success");	// add quotes to convert to string
		});
	 });

	app.post('/saveContactData', function(req, res) {
		util.log('Request received: \nmethod: ' + req.method + '\nurl: ' + req.url);
		function trim(value) {
    		return value.replace(/^\s+|\s+$/g,"");
		}
		var d = new Date();
 		var currdate= d.toUTCString();
		// CAN BE EDIT or ADD !!! If there is a postEditDoc._id field it is an EDIT!!!
		var postEditDoc = req.body;
	    if (postEditDoc._id)	{ //here if edit of pre-existing contact
			myContacts.findOneAndUpdate({ "_id" : postEditDoc._id},				
				{ $set: {
						 	 "walnutID"	 				   :			postEditDoc.walnutID,
							 "visibility" 				   :			postEditDoc.visibility,
							 "SirName"					   :			postEditDoc.sirName,
							 "FormalNames" 				   :			postEditDoc.FormalNames,
							 "Names"					   :			trim(postEditDoc.names),
							 "Children"					   :			trim(postEditDoc.children),
							 "Address.1.street_address"    :		 	trim(postEditDoc.street),
							 "Address.1.city"			   :			trim(postEditDoc.city),
							 "Address.1.state"			   :			trim(postEditDoc.state),
							 "Address.1.country"		   : 			trim(postEditDoc.country),
							 "Address.1.zip"			   : 			trim(postEditDoc.zip),
							 "Email.1.Email"			   : 			trim(postEditDoc.email1), 
							 "Email.2.Email"			   : 			trim(postEditDoc.email2),
							 "Email.3.Email"			   : 			trim(postEditDoc.email3), 
							 "Phone.1.Phone"			   : 			trim(postEditDoc.phone1), 
							 "Phone.2.Phone"			   : 			trim(postEditDoc.phone2), 
							 "Notes"        			   :		 	postEditDoc.notes, 
							 "Created"      			   : 			postEditDoc.created,
							 "Updated"      			   :		 	currdate			
						}
				}, {w:1, upsert:true}, function (err,result ){
					if (err) {
						console.log("err in update: " + err);
						res.end();
					} /* fxn err */
					res.writeHead(200, { 					
			    	'Content-Type': 'text/plain',
        		    'Access-Control-Allow-Origin': '*' });
        		    //console.log("trying to write success");
        		    var objToJson = {
        		    	"result" : "Success",
						"editID" : "#NutID_" + postEditDoc._id
					};
					res.end(JSON.stringify(objToJson));
				}	/*  end funtion (err result) */
			);		/* end findOneAndUpdate */

		} else {          /* end if an edit Contact, here if ADD contact */

			 		postEditDoc._id = new ObjectID();
					 var addr_ID = new ObjectID(),
			  			 email_ID = new ObjectID(),
			  			 phone_ID = new ObjectID();
			  		 var newAddress = 
			  		 	[
			  		 		{_id 	 :          addr_ID},
			  		 		{street  : 			trim(postEditDoc.street),
							city     : 			trim(postEditDoc.city), 
							state    : 			trim(postEditDoc.state), 
							country	 : 			trim(postEditDoc.country),
							zip	     : 			trim(postEditDoc.zip)}
					   ];
					  var newEmail = 
					    [
					        {_id     : 			email_ID},      
        				    { email  : 			trim(postEditDoc.email1)},
							{ email  :			trim(postEditDoc.email2)},
							{ email  :			trim(postEditDoc.email3)}
					   ];
      				  var newPhone =
      				    [
							{ _id	 :	 		phone_ID},
							{ phone  : 			trim(postEditDoc.phone1)},
							{ phone	 : 			trim(postEditDoc.phone2)}
					    ];

					 var saveContact = new myContacts(
					  { 
						_id					   : 			postEditDoc._id,
						walnutID			   :			postEditDoc.walnutID,
						visibility			   :			postEditDoc.visibility,
						SirName				   :			trim(postEditDoc.sirName),
						FormalNames			   :			trim(postEditDoc.FormalNames),
						Names			 	   :			trim(postEditDoc.names),
						Children			   :			trim(postEditDoc.children),
						Address   			   :            newAddress,
						Email 				   :            newEmail,
						Phone				   : 			newPhone,
						Notes        		   :		 	postEditDoc.notes,  
						Created     		   : 			currdate,
						Updated     		   :		 	""
					} );

					saveContact.save( function (err) {
			 			if (err) {
			 				console.log("err in update: " + err);
			 				res.end("Something went wrong!");
			 			} /* fxn err */
			 			res.writeHead(200, { 					
			 		  		'Content-Type': 'text/plain',
        			    	'Access-Control-Allow-Origin': '*' });
			 		 	var objToJson = {
        		    		"result" : "Success",
							"addID" : "#NutID_" + postEditDoc._id
						};
						res.end(JSON.stringify(objToJson));						
			 		});	/* END SAVE CONTACT   */														   
			}   /* end if else add contact */

	});			/* end app.post save edit/add data routine */

	app.get('/addBdayRoute', function(req, res) {
		res.render('addBday.ejs', {
		});
	});


	app.get('/editBdayRoute', function(req, res) {
		util.log('Request received: \nmethod: ' + req.method + '\nurl: ' + req.url);// this line logs just the method and url
		var requestedIdtoEdit = req.param("target");
		var matchedBDay = {};		
		console.log("in app.get  /editBdayRoute where requestedIdtoEdit is " +  requestedIdtoEdit);
		myBdays.findOne({"_id": requestedIdtoEdit}, function (err, matchedBday){			
			if (err) {
				console.log(err); 				
			}
			console.log("in app.get  /editBdayRoute where mongodb returned data is " + matchedBday);
			return res.render('editBday.ejs', {	
				_id   : requestedIdtoEdit,		
				fname : matchedBday.FirstName,
				lname : matchedBday.LastName,
				mi    : matchedBday.MiddleInit,
				bdy   : matchedBday.bDayYYYY,
				bdm   : matchedBday.bDayMM,
				bdd   : matchedBday.bDayDD
			});

		});
	 });

	app.post('/saveBdayData', function(req, res) {
		util.log('Request received: \nmethod: ' + req.method + '\nurl: ' + req.url);
		console.log("in app.post  /saveBdayData where data to be saved is" + req.body);
		function trim(value) {
    		return value.replace(/^\s+|\s+$/g,"");
		}
		// CAN BE EDIT or ADD !!! If there is a postEditDoc._id field it is an EDIT!!!
		var postEditDoc = req.body;
		console.log("in saveBdayData where first name is " + postEditDoc.FirstName + " and _id is " + postEditDoc._id);
	    if (postEditDoc._id)	{ //here if edit of pre-existing contact
			myBdays.findOneAndUpdate({ "_id" : postEditDoc._id},				
				{ $set: {
							 "LastName" 				   :			trim(postEditDoc.LastName),
							 "FirstName"				   :			trim(postEditDoc.FirstName),
							 "MiddleInit"				   :			trim(postEditDoc.MI),
							 "bDayYYYY"  				   :		 	trim(postEditDoc.bDayYYYY),
							 "bDayMM"					   :			trim(postEditDoc.bDayMM),
							 "bDayDD"			  		   :			trim(postEditDoc.bDayDD)						
						}
				}, {w:1, upsert:true}, function (err,result ){
					if (err) {
						console.log("err in update: " + err);
						res.end();
					} /* fxn err */
					res.writeHead(200, { 					
			    	'Content-Type': 'text/plain',
        		    'Access-Control-Allow-Origin': '*' });
        		    console.log("in saveBdayData after apparent success in update of  bDay with _id " + postEditDoc._id);
        		    var objToJson = {
        		    	"result" : "Success",
						"positionID" : postEditDoc._id // used to scroll to new or edited item
					};
					res.end(JSON.stringify(objToJson));
				}	/*  end funtion (err result) */
			);		/* end findOneAndUpdate */

		} else {          /* end if an edit Contact, here if ADD contact */

			 		postEditDoc._id = new ObjectID();
					 

					var saveBday   = new myBdays( {				  
						_id					: 			postEditDoc._id,
						"LastName" 			:			trim(postEditDoc.LastName),
						"FirstName"			:			trim(postEditDoc.FirstName),
						"MiddleInit"		:			trim(postEditDoc.MI),
						"bDayYYYY"  		:		 	trim(postEditDoc.bDayYYYY),
						"bDayMM"			:			trim(postEditDoc.bDayMM),
						"bDayDD"			:			trim(postEditDoc.bDayDD)	
					} );

					saveBday.save( function (err) {
			 			if (err) {
			 				console.log("err in update: " + err);
			 				res.end("Something went wrong!");
			 			} /* fxn err */
			 			res.writeHead(200, { 					
			 		  		'Content-Type': 'text/plain',
        			    	'Access-Control-Allow-Origin': '*' });
			 		 	var objToJson = {
        		    		"result" : "Success",
							"positionID" : postEditDoc._id // used to scroll to new or edited item
						};
        		    	console.log("in saveBdayData after apparent success in new addition of bday with _id " + postEditDoc._id);
						res.end(JSON.stringify(objToJson));						
			 		});	/* END SAVE CONTACT   */														   
			}   /* end if else add contact */

	});

	 app.get('/rmBdayRoute', function(req, res) {		 
        util.log('Request received: \nmethod: ' + req.method + '\nurl: ' + req.url);// this line logs just the method and url		
		var rmRequestID = req.param("target");		
		var rmResult;
		myBdays.remove({_id: rmRequestID}, function (err, rmResult)	{			
			 if (err) {			
				res.writeHead(200, { 
		    	'Content-Type': 'text/plain',
        	    'Access-Control-Allow-Origin': '*' });// implementation of CORS 
				res.end("Failed");	// add quotes to convert to string	
			} else {
 			//mongoose.model('Bday').find({}, null, {sort:{LastName:1}}, function (err, bdays){			
 				Bdays.find({}, null, {sort:{LastName:1}}, function (err, bdays) {			 				
				 	return  res.render('listBdays.ejs', {
						    user : req.user.local.email,
						    title : "List Birthdays",
						    bDays: bdays,
						    numBdays : bdays.length		    
   						});
     			})
 			}
		
			});
		});
	 

	app.post('/search', function(req, res) {
        util.log('Request received: \nmethod: ' + req.method + '\nurl: ' + req.url);// this line logs just the method and url
 		var matchedItem = {};
 		var resultString = "";
		var searchRequest = req.body.target;
		myContacts.findOne({'SirName': new RegExp('^'+searchRequest+'.*', "i") }, function (err, matchedItem){			
			if (!matchedItem){
				
				resultString = "No match";
			}
			if (err) {
				console.log(err);
				res.redirect('/main');
			}
            res.writeHead(200, { 
		    	'Content-Type': 'text/plain',
        	    'Access-Control-Allow-Origin': '*' });// implementation of CORS 
	 		res.end(matchedItem ? matchedItem._id + '' : resultString);
		});			 
	});

	
	// this route called by forgot.ejs form that sends an email
	app.post('/forgot', function(req, res, next) {
		async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
        Users.findOne({ "local.email": req.body.email }, function(err, user) {
       		if (!user) {
       			console.log("in app.post /forgot  where req.body.email is: " + req.body.email + " and user is: " + user);
       		  req.flash('error', 'No account with that email address exists.');
       		  return res.render('forgot',{
	   		  	message : 'No account with that email address exists.'
	   		  });
       		} else {
       			console.log("in app.post /forgot  where req.body.email is: " + req.body.email + " and user is: " + user);
       			user.local.resetPasswordToken = token;
       			user.local.resetPasswordExpires = Date.now() + 3600000; // 1 hour       		
       			user.local.save(function(err) {
       			  done(err, token, user);
       			 });
       		}
        });
    },
    function(token, user, done) {
    	console.log("token is: " + token + " user is: " + user );

    	// This is your API key that you retrieve from www.mailgun.com/cp (free up to 10K monthly emails)
		var auth = {
		 auth: {
		 	// need to encrypt!!!
	//	   api_key: 'key-0f4c723fa96c59328c9659405d0f14aa', //MAILGUN_API_KEY,
	//	   domain: 'one of your domain names listed at your https://mailgun.com/app/domains'
	//	   domain: 'mail.ourchestnuts.com'
			api_key  : configAuth.mailGunAuth.api_key,
			domain   : configAuth.mailGunAuth.domain
		 }
		}; 
		

    	var nodemailerMailgun = nodemailer.createTransport(mg(auth));

		nodemailerMailgun.sendMail({
  			from: 'passwordreset@ourchestnuts.com',
  			to: req.body.email, // An array if you have multiple recipients.
  			subject: 'Password Reset',
  			text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
         		  'http://' + req.headers.host + '/reset/' + token + '\n\n' +
         		 'If you did not request this, please ignore this email and your password will remain unchanged.\n'   		
			},  function(err) {
   				 if (err)  {return next(err);}
    			//res.redirect('/forgot');
    				res.render('forgot',{
	      				message : 'Check your email to reset password!'
	      			});
				});
	  } ] );
});



app.get('/clear', function(req, res) {
	var Users = require('../models/user');
	Users.findOne({ "resetPasswordToken" : req.params.token, "resetPasswordExpires" : { $gt: Date.now() } },
	 function(err, doc) {
		console.log("resetPasswordToken: " + resetPasswordToken );
		console.log("resetPasswordExpires: " + resetPasswordToken );
		console.log("err: " + err );
		console.log("doc: " + doc);
		user.password = undefined;
		user._id = undefined;
		user.local.email = undefined;
        user.local.resetPasswordToken = undefined;
        user.local.resetPasswordExpires = undefined;

        user.save(function(err) {
            req.logIn(user, function(err) {
                done(err, user);
		    });
	    });
	});
});		

app.get('/reset/:token', function(req, res) {
	  var Users = require('../models/user');
	  console.log("reset.params.token: " + req.params.token);
	  Users.findOne({ "local.resetPasswordToken" : req.params.token, "local.resetPasswordExpires" : { $gt: Date.now() } }, function(err, user) {
	    if (!user) {
	    	console.log("in get /reset/:token where err is: " + err + " and doc is: " + user);
	      req.flash('error', 'Password reset token is invalid or has expired.');
	      //return res.redirect('/forgot');
	      return res.render('forgot',{
	      	message : 'Password reset token invalid or expired.'
	      });
	    }
	     return res.render('updatePassword', {
	      user: req.user,
	      token: req.params.token,
	      message: "Updating..."
	    });
	  });
	});

app.post('/reset', function(req, res) {
  async.waterfall([
    function(done) {
      Users.findOne({ "local.resetPasswordToken" : req.param('token'), "local.resetPasswordExpires": { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
		var newUserInstance = new Users();
		var newPw = newUserInstance.generateHash(req.body.newPassword1);
		// newPassword1 below is the plain text name password input attribute, whereas newPw is the bcryptr hash of same
        console.log("in post /reset/:token where new password is: " + req.body.newPassword1 + " and bcrypt hashed is: " + newPw);
        user.local.password = newPw; 
        user.local.resetPasswordToken = undefined;
        user.local.resetPasswordExpires = undefined;

       return user.save(function(err) {
          req.logIn(user, function(err) {
            done(err, user);
          });
        });
      });
    },
    function(user, done) {
    	// This is your API key that you retrieve from www.mailgun.com/cp (free up to 10K monthly emails)
		var auth = {
			 auth: {
	//	   api_key: 'key-e9905ba5869c4e6828501e26884d2574', // MAILGUN_API_KEY,
	//	   domain: 'one of your domain names listed at your https://mailgun.com/app/domains'
	//	   domain: 'mail.ourchestnuts.com'
				api_key  : configAuth.mailGunAuth.api_key,
				domain   : configAuth.mailGunAuth.domain
			 }
		 };
		

    	var nodemailerMailgun = nodemailer.createTransport(mg(auth));    	
    	nodemailerMailgun.sendMail({
  			from: 'passwordreset@ourchestnuts.com',
  			to: user.local.email, // An array if you have multiple recipients.
  			subject: 'Your password has been changed',
  			text:  'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.local.email + ' has just been changed.\n'    		  
    	}, function(err) {
    			res.redirect('/');
 			 });
	}]);
});

// reset request
app.get('/forgot', function(req, res) {
  	res.render('forgot', {
   		 user: req.user,
   		 message: ""
  	});
});


// LOGOUT ==============================
app.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/');
});

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

	// locally --------------------------------
		// LOGIN ===============================
		// show the login FormalNames
		app.get('/login', function(req, res) {
			res.render('login.ejs', { message: req.flash('loginMessage') });
		});

		// process the login form
		// app.post('/login', passport.authenticate('local-login', {
		// 	successRedirect : '/main', // redirect to the main triage section
		// 	failureRedirect : '/login', // redirect back to the login page if there is an error
		// 	failureFlash : true // allow flash messages
		// 	}
		// ));
		app.post('/login', function(req, res, next) {
		   passport.authenticate('local-login', function(err, user, info) {
		    if (err) { console.log("line 456 err: " + err); return next(err); }
		    if (!user) {console.log("line 457 info: " + info); return res.redirect('/login'); }
		    req.logIn(user, function(err) {
		      if (err) { console.log("line 459 err: " + err); return next(err); }
		      return res.redirect('/main');
		    });
		  })(req, res, next);
		});

		// SIGNUP =================================
		// show the signup form
		app.get('/signup', function(req, res) {
			res.render('signup.ejs', { message: req.flash('signupMessage') });
		});

		// process the signup form
		app.post('/signup', passport.authenticate('local-signup', {
			successRedirect : '/main', // redirect to the secure profile section
			failureRedirect : '/signup', // redirect back to the signup page if there is an error
			failureFlash : true // allow flash messages
			}
		));

	// facebook -------------------------------

		// send to facebook to do the authentication
		app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

		// handle the callback after facebook has authenticated the user
		app.get('/auth/facebook/callback',
			passport.authenticate('facebook', {
				successRedirect : '/main',
				failureRedirect : '/'
			}
		));

		//app.get('/auth/facebook/callback', function(req, res, next) {
		//  passport.authenticate('facebook', function(err, user, info) {
		//    if (err) { console.log("line 494 err: " + err); return next(err); }
		//    if (!user) {console.log("line 495 info: " + info); return res.redirect('/'); }
		//    req.logIn(user, function(err) {
		//      if (err) { console.log("line 497 err: " + err); return next(err); }
		//      return res.redirect('/main');
		//    });
		//  })(req, res, next);
		//});


	// twitter --------------------------------

		// send to twitter to do the authentication
		app.get('/auth/twitter', passport.authenticate('twitter', { scope : 'email' }));

		// handle the callback after facebook has authenticated the user
		app.get('/auth/twitter/callback',
		passport.authenticate('twitter', {
			successRedirect : '/main',
			failureRedirect : '/'
			}
		));
		
		// handle the callback after twitter has authenticated the user
		app.get('/auth/twitter/callback', function(res, req, next) {
		 passport.authenticate('twitter', function(err, user, info) {
		    if (err) { console.log("line 494 err: " + err); return next(err); }
		    if (!user) {console.log("line 495 info: " + info); return res.redirect('/'); }
		    req.logIn(user, function(err) {
		      if (err) { console.log("line 497 err: " + err); return next(err); }
		      return res.redirect('/main');
		    });
		  })(req, res, next);
	    });		


	// google ---------------------------------

		// send to google to do the authentication
		app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

		// the callback after google has authenticated the user
		//app.get('/auth/google/callback',
			app.get('/oauth2callback',
			passport.authenticate('google', {
				successRedirect : '/main',
				failureRedirect : '/'
			}
		));

// =============================================================================
// AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
// =============================================================================

	// locally --------------------------------
		app.get('/connect/local', function(req, res) {
			res.render('connect-local.ejs', { message: req.flash('loginMessage') });
		});

		app.post('/connect/local', passport.authenticate('local-signup', {
			successRedirect : '/profile', // redirect to the secure profile section
			failureRedirect : '/connect/local', // redirect back to the signup page if there is an error
			failureFlash : true // allow flash messages
			}
		));

	// facebook -------------------------------

		// send to facebook to do the authentication
		app.get('/connect/facebook', passport.authorize('facebook', { scope : 'email' }));

		// handle the callback after facebook has authorized the user
		app.get('/connect/facebook/callback',
			passport.authorize('facebook', {
				successRedirect : '/profile',
				failureRedirect : '/'
			}
		));

	// twitter --------------------------------

		// send to twitter to do the authentication
		app.get('/connect/twitter', passport.authorize('twitter', { scope : 'email' }));

		// handle the callback after twitter has authorized the user
		app.get('/connect/twitter/callback',
			passport.authorize('twitter', {
				successRedirect : '/profile',
				failureRedirect : '/'
			}
		));


	// google ---------------------------------
		// send to google to do the authentication
		app.get('/connect/google', passport.authorize('google', { scope : ['profile', 'email'] }));

		// the callback after google has authorized the user
		app.get('/connect/google/callback',
			passport.authorize('google', {
				successRedirect : '/profile',
				failureRedirect : '/'
			}
		));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

	// local -----------------------------------
	app.get('/unlink/local', isLoggedIn, function(req, res) {
		var user            = req.user;
		user.local.email    = undefined;
		user.local.password = undefined;
		user.save(function(err) {
			res.redirect('/profile');
		});
	});

	// facebook -------------------------------
	app.get('/unlink/facebook', isLoggedIn, function(req, res) {
		var user            = req.user;
		user.facebook.token = undefined;
		user.save(function(err) {
			res.redirect('/profile');
		});
	});

	// twitter --------------------------------
	app.get('/unlink/twitter', isLoggedIn, function(req, res) {
		var user           = req.user;
		user.twitter.token = undefined;
		user.save(function(err) {
			res.redirect('/profile');
		});
	});

	// google ---------------------------------
	app.get('/unlink/google', isLoggedIn, function(req, res) {
		var user          = req.user;
		user.google.token = undefined;
		user.save(function(err) {
			res.redirect('/profile');
		});
	});




// route middleware to ensure user is logged in
	function isLoggedIn(req, res, next) {
		if (req.isAuthenticated())
			return next();
		res.redirect('/');
	}

};