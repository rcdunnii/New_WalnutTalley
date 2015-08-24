function list() {
    	$(".content").mCustomScrollbar({
    	    mouseWheel: true,
    	    scrollButtons: {
    	        enable: true
    	    },
    	    theme: "light-thick",
    	    advanced: {
    	        autoScrollOnFocus: true,
    	        updateOnContentResize: true,
    	        updateOnBrowserResize: true
    	    }
    	});    
}

function rmContact(contactID) {
    var jqxhr, result;
    //console.log("in rmContact. contactid is:" + contactID);
    jqxhr = $.ajax({ 
        'headers' : {'Content-Type' : 'application/json'},
        'processData' : true,  
        type: 'GET',
        data : {target : contactID}, // data to be sent to server
        dataType: "text",       // type data expected back
        url: "/rmContactRoute"
    }).done(function(result) { 
        if (result === "Success") {
               // $(".messages").text(result).fadeOut(2000, function() {
                 $(".messages").addClass('pinkClass').text(result).fadeOut(10000, function() {
                   $(this).addClass('pinkClass').empty().show();
               });
                //$(".list").show();
                //$(".sirNameDisplay").hide(); // if an addContact submission                
                //$(".edit").hide();

            } else {
                 $(".messages").addClass('pinkClass').text(result).fadeOut(10000, function() {
                   $(this).addClass('pinkClass').empty().show();
               });
                //$(".list").show();
                //$(".sirNameDisplay").hide(); // if an addContact submission                
                //$(".edit").hide();
        }
       
        var thisHost = window.location.host;                                    
        window.location.replace("http://" + thisHost + "/mainChoice?main=listNuts");
        // window.location.replace("http://localhost:8080/mainChoice?main=listNuts"); // development    
        //window.location.replace("http://heroku-node-contacts.herokuapp.com/mainChoice?main=listNuts"); // production
    }).fail (function (jqxhr, status, error) {
                alert("error: " + error + " status: " + status + " jqxhr.responseText: " + jqxhr.responseText + " at line   179 listNuts.ejs");
        }); 
  }   

// fills in the edit form with data from chestnuts db

function getContact(contactID) {
    $(".highlight").removeClass("highlight"); // remove highlight if contact was target of search (which highlights SirName)
    var jqxhr;
    console.log("in getContact(contactID) fxn in main.js where contactid is:" + contactID);
    jqxhr = $.ajax({ 
        'headers' : {'Content-Type' : 'application/json'},
        'processData' : false,  
        type: 'POST',
        data : JSON.stringify({'target' : contactID}), // data to be sent to server
        dataType: "json",       // type data expected back
        url: "/editContactRoute"
    }).done(function(data) { 
        console.log("data object returned from mongodb is :" + data); //=> [object Object]
        console.log("JSON.stringify(data object)) returned from mongodb is :" + JSON.stringify(data));
        //console.log("JSON.parse(JSON.stringify(data object)) returned from mongodb is :" + JSON.parse(JSON.stringify(data))); => [object Object]
        data = JSON.parse(JSON.stringify(data));
        $("#contactForm")[0].reset();  // this works! It clears the form 
        $(".listTitleHdr").html("<h1 class='listTitleHdr'>" + data.SirName + "</h1>");
        $("#_id").val(data._id);
        $("#addr_id").val(data.Address[0]._id);
        $("#email_id").val(data.Email[0]._id);
        $("#phone_id").val(data.Phone[0]._id);
        $("#walnutID").val(data.walnutID);
        $("#visibility").val(data.visibility);
        $("#formalNames").val(data.FormalNames);
        $("#sirName").val(data.SirName);
        if (data.Names) {$("#names").val(data.Names);}                        
        if (data.Children) {$("#children").val(data.Children);}
        if (data.Address[0]._id) { $("addr_id").val(data.Address[0]._id);}
        if (data.Address[1].street_address) { $("#street").val(data.Address[1].street_address);}
        if (data.Address[1].city) { $("#city").val(data.Address[1].city);}
        if (data.Address[1].state) {$("#state").val(data.Address[1].state);}
        if (data.Address[1].country) {$("#country").val(data.Address[1].country);}
        if (data.Address[1].zip) {$("#zip").val(data.Address[1].zip);}
        if (data.Email[1]) {$("#email1").val(data.Email[1].Email);}
        if (data.Email[2]) {$("#email2").val(data.Email[2].Email);}
        if (data.Email[3]) {$("#email3").val(data.Email[3].Email);}
        if (data.Phone[1]) {$("#phone1").val(data.Phone[1].Phone);}
        if (data.Phone[2]) {$("#phone2").val(data.Phone[2].Phone);}
        if (data.Notes) {$("#notes").val(data.Notes);}
        if (data.Created) { $("#created").val(data.Created);}
        if (data.Updated) {$("#udated").val(data.Updated);}
        $(".list").hide();
        $(".edit").show();
    }).fail ( function (jqxhr, status, error) {
            alert("error: " + error + " status: " + status + " jqxhr.responseval: " + jqxhr.responseval + " at line 73 main.js"   );
    });

}   /* function edit contact */

function getBday(bDay_ID) {
    var jqxhr;
    console.log("in getBday fxn in main.js where bDay_ID :" + bDay_ID);
    jqxhr = $.ajax({ 
        'headers' : {'Content-Type' : 'application/json'},
        'processData' : false,  
        type: 'POST',
        data : JSON.stringify({'target' : bDay_ID}), // data to be sent to server
        dataType: "json",       // type data expected back
        url: "/editBdayRoute"
    }).done(function(data) {
        console.log("data object returned from mongodb is :" + data); 
        console.log("JSON.stringify(data object)) returned from mongodb is :" + JSON.stringify(data));
        data = JSON.parse(JSON.stringify(data));
        $("#editBDayForm")[0].reset();  // this works! It clears the form 
        $("#bDayID").val(data._id);
        $("#FirstName").val(data.FirstName);
        $("#MI").val(data.MiddleInit);
        $("#LastName").val(data.LastName);
        $("#bDayYYYY").val(data.bDayYYYY);
        $("#bDayMM").val(data.bDayMM);
        $("#bDayDD").val(data.bDayDD);
    }).fail ( function (jqxhr, status, error) {
            alert("error: " + error + " status: " + status + " jqxhr.responseval: " + jqxhr.responseval + " at line 150 main.js"   );
    });
}


function resetForm($form) {
    $form.find('input:text, input:password, input:file, input:email, input:hidden, select, textarea').val('');
    $form.find('input:radio, input:checkbox')
         .removeAttr('checked').removeAttr('selected');
}

function autoGrow (oField) {
  if (oField.scrollHeight > oField.clientHeight) {
    oField.style.height = oField.scrollHeight + "px";
  }
}

$.fn.serializeObject = function()
{
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};