module.exports    = function(app, passport) {
var mongoose      = require('mongoose');
var util          = require('util');
var ObjectID      = require('mongodb').ObjectID;
var myContacts    = require('../models/contacts');
var myBdays       = require('../models/bday');
var myUsers       = require('../models/user');
var async         = require('async');
var crypto        = require('crypto');
var configAuth    = require('../conf/auth'); // use this one for testing
var { mailgun_key,
      mail_domain,
      recap_site_key,
      recap_secret_key }
                  = require('../conf/config.js');
var mailgun       = require("mailgun-js");
var mg            = mailgun({apiKey: mailgun_key, domain: mail_domain});
var request       = require('request');

//import Recaptcha from 'express-recaptcha'
var Recaptcha = require('express-recaptcha').RecaptchaV3;
var recaptcha = new Recaptcha(recap_site_key, recap_secret_key, {callback: 'cb'});

/*
console.log("recap_site_key is: " + recap_site_key);
console.log("recaptcha._site_key is: "  + recaptcha._site_key);
console.log("recap_secret_key is: " + recap_secret_key);
console.log("recaptcha._secret_key is: "  + recaptcha._secret_key);
*/

Object.defineProperty(global, '__stack', {
    get: function(){
      var orig = Error.prepareStackTrace;
      Error.prepareStackTrace = function(_, stack){ return stack; };
      var err = new Error();
      Error.captureStackTrace(err, arguments.callee);
      var stack = err.stack;
      Error.prepareStackTrace = orig;
      return stack;
    }
});
  
Object.defineProperty(global, '__file', {
    get: function(){
      return __stack[1].getFileName();
    }
});
  
Object.defineProperty(global, '__line', {
    get: function(){
      return __stack[1].getLineNumber();
    }
});

// normal routes ==============================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
    console.log("Home Page, '/'");
    res.render('index.ejs');
        // res.render ends response after sending client rendered HTML
        // do not call res.end()
    });

// MAIN SECTION =========================

    app.get('/listem', function(req, res) {
    console.log("at /listem");
        myUsers.find(function(err, users) {
        res.render('listUsers.ejs', { users: users, title : "Users"});
       });
    });   // end app.get /listen

    app.get('/main', isLoggedIn, function(req, res) {
    console.log("at /main");
    console.log("Line: " + __line + "File: " + __file);
        res.render('main.ejs');
    }); // end app.get /main
    
    app.get('/mainChoice', isLoggedIn, function(req, res) {
    console.log("at /mainChoice");
    var mainRequest = req.query.main;
    switch (mainRequest) {
       case "listNuts": 
        myContacts.find({}, null,{sort:{SirName:1}},
           function(err, nuts) {                
               res.render('listNuts.ejs', {
                 user : req.user.local.email,
                 title : "Contact List",
                 nuts: nuts,
                 searching : false,
                 numNuts : nuts.length
              });
        });
        break;
       case "listBdays":
        myBdays.find({}, null, {sort:{LastName:1}},
                   function (err, bdays) {
                res.render('listBdays.ejs', {
                  user  : req.user.local.email,
                  title : "Birthdays",
                  bDays : bdays,
                      numBdays : bdays.length           
            });
         });
         break;
       case "logout":
        req.logout();
        res.redirect('/');
        break;
       default :
        console.log("Error");
            console.log("Line: " + __line + "File: " + __file);
        req.logout();
        res.redirect('/');
    } // end switch
    });   // end app.get mainChoice
    
    app.get('/profile', isLoggedIn, function(req, res) {
            console.log("at /profile");
        res.render('profile.ejs', {
        user : req.user
        });
    });   // end app.get /profile

/* following is called by onclick event on member of
   list of contacts which in turn calls getContact()
   in main.js which makes ajax call here to select a
   document for edit; this returns the current document
   to ajax routine that sends the document to the edit
   screen for editing and viewing */

    app.post('/editContactRoute', function(req, res) {      
        console.log("at /editContactroute");
        console.log('Request received: \nmethod: ' + req.method + '\nurl: ' + req.url);// this line logs just the method and url
    console.log("Line: " + __line + "File: " + __file);
        var matchedContact = {}; // {} === blank object
        var editRequest = req.body.target;
        console.log("in app.post line " + __line + " /editContactRoute where editRequest is " + editRequest);
        myContacts.findOne({"_id":editRequest}, function (err, matchedContact){         
            if (err) {
                 console.log("Error");
                     console.log("Line: " + __line + "File: " + __file);
                         res.redirect('/') //Fri Aug 28 22:33:43 CDT 2020
            }
            res.writeHead(200, { 
                'Content-Type': 'text/plain',
                    'Access-Control-Allow-Origin': '*' });// CORS 
/*          res.end(JSON.stringify(matchedContact));   */
            res.send(JSON.stringify(matchedContact));
        });
     });   // end app.post /editContactRoute

     app.get('/rmContactRoute', function(req, res) {
           console.log("at /editcontactRoute");     
           console.log('Request received: \nmethod: ' + req.method + '\nurl: ' + req.url);
            /* var rmRequestID = req.param("target");  */
        var rmRequestID = req.query.target;
       console.log("req.query.target is " + req.query.target + " at line " + __line + "  in routeNut.js");
        var rmResult;
        myContacts.deleteOne({_id: rmRequestID},
                   function (err, rmResult){
             if (err) {
                res.writeHead(err, { 
                           'Content-Type': 'text/plain',
                                'Access-Control-Allow-Origin': '*'
                                }); //  CORS 
                res.send("Failed");
             }
             res.writeHead(200, { 
                    'Content-Type': 'text/plain',
                        'Access-Control-Allow-Origin': '*'
                         }); //  CORS 
/*           res.send("Success");   */
             res.redirect(200,'/');
        });
    }); // end rmContactRoute

     app.post('/saveContactData', function(req, res) {
            console.log("at /saveContactData");
        util.log('Request received: \nmethod: ' + req.method + '\nurl: ' + req.url);
        function trim(value) {  /* trimming fxn */
                return value.replace(/^\s+|\s+$/g,"");
        }
        var d = new Date();
        var currdate= d.toUTCString();
        /* CAN BE EDIT or ADD */
                /* If postEditDoc._id field it is EDIT */
        var postEditDoc = req.body;

            if (postEditDoc._id) { 
           myContacts.findOneAndUpdate({ "_id" : postEditDoc._id},
            { $set: {
             "walnutID" :   postEditDoc.walnutID,
             "visibility"   :   postEditDoc.visibility,
             "SirName"  :   trim(postEditDoc.sirName),
             "FirstName"    :    trim(postEditDoc.firstName),
//"FormalNames"    :    trim(postEditDoc.FormalNames),
// "OtherFamilyMembers"   : trim(postEditDoc.otherFamilyMembers),
             "Children" :   trim(postEditDoc.children),
    "Address.1.street_address"  :   trim(postEditDoc.street),
            "Address.1.city"     :  trim(postEditDoc.city),
                "Address.1.state"    :  trim(postEditDoc.state),
                "Address.1.country"  :  trim(postEditDoc.country),
                "Address.1.zip"      :  trim(postEditDoc.zip),
                "Email.1.Email"      :  trim(postEditDoc.email1), 
                    "Email.2.Email"      :  trim(postEditDoc.email2),
            "Email.3.Email"      :  trim(postEditDoc.email3), 
            "Phone.1.Phone"      :  trim(postEditDoc.phone1), 
            "Phone.2.Phone"      :  trim(postEditDoc.phone2), 
            "Notes"          :  postEditDoc.notes, 
            "Created"            :  postEditDoc.created,
            "Updated"        :  currdate
                            }
                }, {w:1, upsert:true}, function (err,result ){
            if (err) {
                    console.log("Error ");
                            console.log("Line: " + __line + "File: "
                                    + __file);
                res.writeHead(err, { 
                           'Content-Type': 'text/plain',
                           'Access-Control-Allow-Origin': '*' }); 
                res.send("upsert Failed");
/*console.log("err in update: " + err);
res.end(); 
-- or --
res.send(err);
*/
            } /* fxn err */
            res.writeHead(200, { 
            'Content-Type': 'text/plain',
                    'Access-Control-Allow-Origin': '*' });
                    var objToJson = {
                       "result" : "Success",
            /* "editID" : "#NutID_" + postEditDoc._id   */
               "editID" : "NutID_" + postEditDoc._id
            };
/*          res.end(JSON.stringify(objToJson));   */
            res.send(JSON.stringify(objToJson));
            }
        );      /* end findOneAndUpdate */
    } else {    /* here if ADD contact */
         postEditDoc._id = new ObjectID();
         var addr_ID  = new ObjectID(),
         email_ID = new ObjectID(),
         phone_ID = new ObjectID();
         var newAddress = 
            [
            {_id     :      addr_ID},
            {street  :  trim(postEditDoc.street),
            city     :  trim(postEditDoc.city), 
            state    :  trim(postEditDoc.state), 
            country  :  trim(postEditDoc.country),
            zip      :  trim(postEditDoc.zip)}
           ];
          var newEmail = 
            [
                {_id     :  email_ID},      
                    { email  :  trim(postEditDoc.email1)},
            { email  :  trim(postEditDoc.email2)},
            { email  :  trim(postEditDoc.email3)}
           ];
              var newPhone =
                [
            { _id    :  phone_ID},
            { phone  :  trim(postEditDoc.phone1)},
            { phone  :  trim(postEditDoc.phone2)}
            ];
                  var saveContact = new myContacts(
             { 
            _id      :  postEditDoc._id,
                walnutID :  postEditDoc.walnutID,
            visibility   :  postEditDoc.visibility,
            SirName  :  trim(postEditDoc.sirName),
            FirstName     : trim(postEditDoc.firstName),
//  FormalNames    :    trim(postEditDoc.FormalNames),
//  OtherFamilyMembers :    trim(postEditDoc.otherFamilyMembers),
            Children :  trim(postEditDoc.children),
            Address  :      newAddress,
            Email    :      newEmail,
            Phone    :  newPhone,
            Notes    :  postEditDoc.notes,  
            Created  :  currdate,
            Updated  :  ""
             });
              saveContact.save( function (err) {
             if (err) {
               console.log("Error ");
                   console.log("Line: " + __line + "File: " + __file);
               res.send("Something went wrong!");
             } /* fxn err */
             res.writeHead(200, { 
                'Content-Type': 'text/plain',
                    'Access-Control-Allow-Origin': '*' 
                 });
             var objToJson = {
                    "result" : "Success",
            /* "addID"  : "#NutID_" + postEditDoc._id  */
                    "addID" : "NutID_" + postEditDoc._id
             };
             res.end(JSON.stringify(objToJson));
           });  /* END SAVE CONTACT   */
        }   /* end if else add contact */
    });         /* end saveContactData routine */

    app.get('/addBdayRoute', function(req, res) {
             console.log("at /addBdayRoute");
        res.render('addBday.ejs', {
        });
    });   //end app.get addBdayRoute


    app.get('/editBdayRoute', function(req, res) {
              console.log("at /editBdayRoute");
        util.log('Request received: \nmethod: ' + req.method + '\nurl: ' + req.url);// this line logs just the method and url
//      var requestedIdtoEdit = req.param("target");
        var requestedIdtoEdit = req.params.target;
        var matchedBDay = {};       
        console.log("in app.get  /editBdayRoute where requestedIdtoEdit is " +  requestedIdtoEdit);
        myBdays.findOne({"_id": requestedIdtoEdit},
                   function (err, matchedBday){
            if (err) {
               console.log("Error ");
                       console.log("Line: " + __line +
                              "File: " + __file);
            }
            console.log("File: " + __file + " where mongodb returned data is " + matchedBday);
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
     });   // end app.get editBdayRoute

    app.post('/saveBdayData', function(req, res) {
           console.log("at /saveBdayData");
        util.log('Request received: \nmethod: ' + req.method + '\nurl: ' + req.url);
        console.log("in app.post  /saveBdayData where data to be saved is" + req.body);
        function trim(value) {
               return value.replace(/^\s+|\s+$/g,"");
        }
/* CAN BE EDIT or ADD !!! If a postEditDoc._id field it is an EDIT */
        var postEditDoc = req.body;
        console.log("in saveBdayData where first name is " + postEditDoc.FirstName + " and _id is " + postEditDoc._id);
        if (postEditDoc._id) { // here if edit of pre-existing contact
        myBdays.findOneAndUpdate({ "_id" : postEditDoc._id},
            { $set: {
             "LastName"  :  trim(postEditDoc.LastName),
             "FirstName" :  trim(postEditDoc.FirstName),
             "MiddleInit"   :   trim(postEditDoc.MI),
             "bDayYYYY"  :  trim(postEditDoc.bDayYYYY),
             "bDayMM"    :  trim(postEditDoc.bDayMM),
             "bDayDD"    :  trim(postEditDoc.bDayDD)
                    }
            }, {w:1, upsert:true}, function (err,result ){
                   if (err) {
                console.log("Error ");
                            console.log("Line: " + __line +
                                   "File: " + __file);
                //console.log("err in update: " + err);
                res.end();
               } /* fxn err */
               res.writeHead(200, { 
                  'Content-Type': 'text/plain',
                       'Access-Control-Allow-Origin': '*' 
                           });
                   console.log("in saveBdayData after apparent success in update of  bDay with _id " + postEditDoc._id);
                   var objToJson = {
                        "result" : "Success",
             /* used to scroll to new or edited item */
                "positionID" : postEditDoc._id
                };
               res.end(JSON.stringify(objToJson));
            /*  end funtion (err result) */
            }
                    );  /* end findOneAndUpdate */
        } else {/* end if an edit Contact, here if ADD contact */
            postEditDoc._id = new ObjectID();
            var saveBday   = new myBdays( { 
               _id      :   postEditDoc._id,
            "LastName"  :   trim(postEditDoc.LastName),
            "FirstName" :   trim(postEditDoc.FirstName),
            "MiddleInit"    :   trim(postEditDoc.MI),
            "bDayYYYY"  :   trim(postEditDoc.bDayYYYY),
            "bDayMM"    :   trim(postEditDoc.bDayMM),
            "bDayDD"    :   trim(postEditDoc.bDayDD)
            } );
            saveBday.save( function (err) {
               if (err) {
                console.log("Error ");  
                    console.log("Line: " + __line + "File: "
                                   + __file);
            /* console.log("err in update: " + err); */
                res.end("Something went wrong!");
                   } /* fxn err */
               res.writeHead(200, {                                       'Content-Type': 'text/plain',
                          'Access-Control-Allow-Origin': '*' })
               var objToJson = {
                    "result" : "Success",
                "positionID" : postEditDoc._id
                               /* used to scroll to new or edited item */
               };
                  console.log("in saveBdayData after apparent success in new addition of bday with _id " + postEditDoc._id);
              res.end(JSON.stringify(objToJson));
              });   /* END saveBday */
        }   /* end if else add contact */
    }); /* END of app.post('/saveBdayData', function(req, res) */

     app.post('/rmBdayRoute', function(req, res) {
            console.log("at /rmBddayRoute");
            util.log('Request received: \nmethod: ' + req.method + '\nurl: ' + req.url);// this line logs just the method and url
        var rmRequestID = req.body.target;
        var rmResult;
            myBdays.deleteOne({_id: rmRequestID},
               function (err, rmResult) {
         if (err) {         
                res.writeHead(err, { 
                'Content-Type': 'text/plain',
                    'Access-Control-Allow-Origin': '*'
                    });  /* CORS  */
            res.send("Failed");// add quotes to convert to string
         } else {
                res.writeHead(200, { 
            'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': '*' });
            var objToJson = {
                "result" : "Success",
                };
                console.log("in rmBdayRoute after apparent success in deletion of bday");
            res.send(JSON.stringify(objToJson));    
        } /* end if/else err */ 
          });     /* end myBdays.deleteOne() */
    });       /* end  app.post('/rmBdayRoute', function(req, res) */
     

    app.post('/searchContacts', function(req, res) {
           console.log("at /searchContacts");
        util.log('Request received: \nmethod: ' + req.method + '\nurl: ' + req.url);
        var matchedItem = {};
        var resultString = "";
        var searchRequest = req.body.target;
        myContacts.findOne({'SirName': new RegExp('^'+searchRequest+'.*', "i") },
                   function (err, matchedItem){
            if (!matchedItem){              
                resultString = "No match";
            }
            if (err) {
               console.log("Error ");
                       console.log("Line: " + __line +
                             "File: " + __file);
               res.redirect('/main');
            }
                        res.writeHead(200, { 
                   'Content-Type': 'text/plain',
                       'Access-Control-Allow-Origin': '*' }); // CORS 
            res.end(matchedItem ? matchedItem._id + '' : resultString);
        });
    });  /* end app.post('/searchContacts', function(req, res)  */

    app.post('/searchBdays', function(req, res) {
           console.log("at /searchBdays");
        util.log('Request received: \nmethod: ' + req.method + '\nurl: ' + req.url);// this line logs just the method and url
        var matchedItem = {};
        var resultString = "";
        var searchRequest = req.body.target;
        Bdays.findOne({'LastName': new RegExp('^'+searchRequest+'.*', "i") }, function (err, matchedItem){
            if (!matchedItem){
                resultString = "No match";
            }
            if (err) {
                console.log(err);
                res.redirect('/main');
            }
                        res.writeHead(200, { 
                   'Content-Type': 'text/plain',
                       'Access-Control-Allow-Origin': '*' });
            res.send(matchedItem ? matchedItem._id + '' : resultString);
        });
    });   //end app.post /searchBdays

    // this route called by forgot.ejs form that sends an email
    app.post('/forgot', function(req, res, next) {
        async.waterfall([ function(done) {
            crypto.randomBytes(20, function(err, buf) {
                var token = buf.toString('hex');
                done(err, token);
                console.log("In line " + __line + " app.post('/forgot,... function done() where token is "  + token);
            });
        },function(token, done) {
        // user request password reset
        // set a time limit on getting a new password
                // send link line 509 below for getting new pw
        console.log("In line " + __line + " in routeNut.js app.post(/forgot,...where token is " + token);
        myUsers.findOne({ "local.email": req.body.email },
                   function(err, users) {
            if (!users) {
                console.log("Line " + __line + " in routeNut.js app.post /forgot  where req.body.email is: " + req.body.email);
                req.flash('error', 'No account with that email address exists.');
                return res.render('forgot',
                { message : 'No such email address exists.'});
            } else {
                users.local.resetPasswordToken =  token;
                users.local.resetPasswordExpires = Date.now() + 3600000;
                users.save(function(err) {
                   done(err, token, users);
                });
            }
        });  // end myUsers.findOne
        console.log("In routeNuts.js line " + __line + " users is " + users + " and token is "+ token);
        },
                function(token, users, done) {
            console.log("Line " + __line + " and token is: " + token + " users is: " + users );
            const data = {  
            from : 'passwordreset@ourchestnuts.com',
            to : req.body.email, // An array if you have multiple recipients.
            subject: 'Password Reset',
            text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' + 'https://' + req.headers.host + '/reset/' + token + '\n\n' + 'If you did not request this, please ignore this email and your password will remain unchanged.\n' 
                };
                mg.messages().send(data, function(err) {    
                       if (err)  {
              console.log("Line " + __line + " inr routeNut.js /forgot function (token,user,done) where body is " + req.body);
              return next(err);
               }
                   console.log("Line " + __line + " where there is no error in send data to forgot");
                   res.render('forgot', {
                   message : "\nCheck your email to reset password!"
                   });
               });
         }]);  // end async waterfall
    });   // end app.post /forgot



app.get('/clear', function(req, res) {
    myUsers.findOne({ "resetPasswordToken" : req.params.token, "resetPasswordExpires" : { $gt: Date.now() } },
     function(err, users) {
        console.log("resetPasswordToken: " + resetPasswordToken );
        console.log("resetPasswordExpires: " + resetPasswordExpires );
        console.log("err: " + err );
        console.log("users: " + users);
        users.password = undefined;
        users._id = undefined;
        users.local.email = undefined;
                users.local.resetPasswordToken = undefined;
                users.local.resetPasswordExpires = undefined;
                users.save(function(err) {
                   req.logIn(users, function(err) {
                      done(err, users);
           });
            });
    });
});   // end app.get /clear

app.get('/reset/:token', function(req, res) {
// called from a user's email who requests password reset
    console.log("In routeNut.js line " + __line + "  req.params.token = " + req.params.token);  
    myUsers.findOne({ "local.resetPasswordToken" : req.params.token,
        "local.resetPasswordExpires" : { $gt: Date.now() } },
           function(err, users) {
          if (!users) {
             console.log("Line " + __line + "in routeNut.js get /reset/:token where err is: " + err );
             req.flash('error', 'Password reset token is invalid or has expired.');
             return res.render('forgot', {
                message : 'Password reset token invalid or expired.'
             });
          }
          console.log("In line " + __line + " in routeNut.js where error is " + err + " and users = " + users);
          return res.render('updatePassword', {      
             token: req.params.token,         
             message: "Updating..."
          });
      });
});   // end app.get /reset/:token


app.post('/reset', function(req, res) {
// called by updatePassword.ejs
console.log("Line " + __line + " in routeNut.js app.post('/reset' where req.body.newPassword1 is " + req.body.newPassword1 + " and req.body.token is " + req.body.token );
   async.waterfall([
      function(done) {
      myUsers.findOne({ "local.resetPasswordToken" : req.body.token,
         "local.resetPasswordExpires": { $gt: Date.now() } },
             function(err,  users) {
                if (!users) {
                   req.flash('error', 'Password reset token is invalid or has expired.');
                   return res.redirect('back');
        }
        console.log("Line " + __line + " where users is " + users);
        /* var newUserInstance = new myUsers(); */
        var newPw = users.generateHash(req.body.newPassword1);
        console.log("Line " + __line + " in routeNut.js app.post('/reset...) where users.local.email is " + users.local.email +" newPw is " + newPw);
        /* newUserInstance.local.email = user.local.email; */
        users.local.password = newPw; 
        users.local.resetPasswordToken = undefined;
    users.local.resetPasswordExpires = undefined;       
        
    users.save(function(err) {
           req.logIn(users, function(err) {
             console.log("Line " + __line + " routeNuts.js after users.save fxn with err = " + err + " and users = " + users);
             done(err, users );
           });
        });
      }); // end 
    }, // end function(done)
    function(users, done) {
    const data = {  
            from: 'passwordreset@ourchestnuts.com',
        to: users.local.email, 
        subject: 'Your password has been changed',
        text:  'Hello,\n\n' +
                       'This is a confirmation that the password for your account ' + users.local.email + ' has just been changed.\n'             
        };
    mg.messages().send(data, function(err, body) {
        if (err)  {
            console.log(body);
            console.log("sendmail error line" + __line + " to " + users.local.email);
        }
    });
    res.redirect('/login');
    }]);
});   // end app.post /reset    

// reset request
app.get('/forgot', function(req, res) {
// calls the user to supply email to use to reset password, returns to  
    res.render('forgot', {
         users: req.user,
         message: " "
    });
});   // end app.get /forgot


// LOGOUT ==============================
app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});   // end app.get /logout

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================
// locally --------------------------------
// LOGIN ===============================
// show the login FormalNames
/* ---------------------NEW   */
 app.get('/login', isNotLoggedIn, recaptcha.middleware.render, function(req, res) {
        // render the page and pass in any flash data if it exists
        console.log(" At app.get(/login at line:" +  __line);
        res.render('login.ejs', { 
            message : req.flash('message'),
            captcha_site_key : recaptcha._site_key
        });
    });
/*------------------------ */
/*-----------------------  */
    app.post('/login', function(req, res, next) {

        var token = req.body[name="g-recaptcha-response"];
        console.log("HERE");
        const verificationURL = "https://www.google.com/recaptcha/api/siteverify?secret=" + recap_secret_key + "&response=" + token;
        request(verificationURL,function(error,response,body) {
           body = JSON.parse(body);
           if (body.success !== undefined && !body.success) {
              console.log({"responseCode" : 1,"responseDesc" : "Failed captcha verification"});
              return res.redirect('/');
           }
           if (body.score < 0.5 ) {
              console.log("Captcha failed with score of " + body.score + " Sorry Bot!");
              return res.redirect('/login');
           }
           console.log("Captcha success with score of " + body.score + " Yea!!");
           return next();
        }); // end verification
    }, // end function(res, req, next)
       passport.authenticate('local-login', {
          successRedirect : '/main',   // -> main page 
          failureRedirect : '/',       
          failureFlash : true          // allow flash messages
     })); // end app.post
     

/*  ---------------------   */

    app.get('/signup', function(req, res) {
        console.log("app.get(/signup");
        res.render('signup.ejs', {
            message: req.flash('Sign Up')
        });
    });   


    app.post('/signup', function(req, res, next) {
        var token = req.body[name="g-recaptcha-response"];
        const verificationURL = "https://www.google.com/recaptcha/api/siteverify?secret=" + recap_secret_key + "&response=" + token;
        request(verificationURL,function(error,response,body) {
            body = JSON.parse(body);
            if(body.success !== undefined && !body.success) {
               console.log({"responseCode" : 1,"responseDesc" : "Failed captcha verification"});
               return res.redirect('/');
            }
            if (body.score < 0.5 ) {
               console.log("Captcha failed with score of " + body.score + " Sorry Bot!");
               return res.redirect('/login');
            }
            console.log("Captcha success with score of " + body.score + "...Yea!!");
            return next();
       }); // end verification
   }, // end function(res, req, next)
    passport.authenticate('local-signup', {
       successRedirect : '/login',   // ->  secure profile section
       failureRedirect : '/', 
       failureFlash : true           // allow flash messages
    }));  // end app.post /signup

    // facebook -------------------------------

        // send to facebook to do the authentication
        app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

        // handle the callback after facebook has authenticated the user
        app.get('/auth/facebook/callback',
            passport.authenticate('facebook', {
            successRedirect : '/main',
            failureRedirect : '/'
        }
        ));  // end app.get /auth/facebook/callback

    // twitter --------------------------------

        // send to twitter to do the authentication
        app.get('/auth/twitter', passport.authenticate('twitter', { scope : 'email' }));

        // handle the callback after twitter authenticats the user
        app.get('/auth/twitter/callback',
        passport.authenticate('twitter', {
            successRedirect : '/main',
            failureRedirect : '/'
        }
        )); // end app.get /auth/twitter/callback


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
        ));  //end app.get /auth/google

// =============================================================================
// AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
// =============================================================================

    // locally --------------------------------
        app.get('/connect/local', function(req, res) {
            res.render('connect-local.ejs', { message: req.flash('loginMessage') });
        }); //end app.get /connect/local

        app.post('/connect/local', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/connect/local', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
            }
        ));  //end app.post /connect/local

    // facebook -------------------------------

        // send to facebook to do the authentication
        app.get('/connect/facebook', passport.authorize('facebook', { scope : 'email' })); // end app.get /connect/facebook

        // handle the callback after facebook has authorized the user
        app.get('/connect/facebook/callback',
            passport.authorize('facebook', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }
        ));   // end app.get /connect/facebook/callback

    // twitter --------------------------------

        // send to twitter to do the authentication
        app.get('/connect/twitter', passport.authorize('twitter', { scope : 'email' }));   // end app.get /connect/twitter

        // handle the callback after twitter has authorized the user
        app.get('/connect/twitter/callback',
            passport.authorize('twitter', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }
        ));   // end app.get /connect/twitter/callback


    // google ---------------------------------
        // send to google to do the authentication
        app.get('/connect/google', passport.authorize('google', { scope : ['profile', 'email'] }));  // end app.get /connect/google

        // the callback after google has authorized the user
        app.get('/connect/google/callback',
            passport.authorize('google', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }
        )); // end app.get /connect/google/callback

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
    });  // end app.get /unlink/local

    // facebook -------------------------------
    app.get('/unlink/facebook', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.facebook.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });  // end app.get /unlink/facebook

    // twitter --------------------------------
    app.get('/unlink/twitter', isLoggedIn, function(req, res) {
        var user           = req.user;
        user.twitter.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });  // end app.get /unlink/twitter

    // google ---------------------------------
    app.get('/unlink/google', isLoggedIn, function(req, res) {
        var user          = req.user;
        user.google.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });  // end app.get /unlink/google


// route middleware to ensure user is logged in
    function isLoggedIn(req, res, next) {
            console.log("File : " + __file + " Line: " + __line);
        if (req.isAuthenticated())
            return next();
        res.redirect('/');
    }  // end function isLoggedIn

    function isNotLoggedIn(req, res, next) {
            console.log("File : " + __file + " Line: " + __line);
        if (!req.isAuthenticated())
            return next();
        res.redirect('/');
    }  // end function isLoggedIn

};
