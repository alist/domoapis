var AdviceRequestModel = require("../model/advicerequest").AdviceRequest
  , Organization = require('../controller/organization').OrganizationController
  , PushController = require('../modules/push/controller/push')
  , OrgUserModel = require('../model/orguser').OrgUser
  , ShortUrlModel = require('../model/shorturl').ShortUrl
  , mailer = require('../lib/mailer')
  , messenger = require('../lib/messenger')
  , Utils = require('../lib/utils')
  , Validator = require('validator').Validator
  , _ = require('lodash')
  , errors = require('../model/errors').errors
  , async = require('async')
  , jade = require('jade')
  , Config = require('../configLoader')
  , path = require('path')
  , async = require('async')
///


var AdviceRequestController = function(){
};

AdviceRequestController.prototype.getInfo = function(req, res) {
  var advicerequestId = req.params.advicerequest;
  var accessToken = req.query.token;
  // TODO: Add validations here

  AdviceRequestModel.findOne({ _id: advicerequestId, accessToken: accessToken }, function(err, advicerequest) {
    if(err) {
      return res.ext.error(err).render();
    }

    if(!advicerequest) {
      return res.ext.error(errors['ADVICEREQUEST_NOT_FOUND']().m).render();
    }

    res.ext.data({ advicerequest: advicerequest.toObject() }).render();
  });
}


//AHL
//for giveAdvice async load detail on website 
//security is given by ensuring advice request's organization (objectRef) == orguser.orgID 
AdviceRequestController.prototype.getAdvicerequestDetail = function(req, res) {
  var advicerequestId = req.params.advicerequestId;
  
  currentUserOrgId = req.extras.orguser.orgId;

  AdviceRequestModel.findOne({ _id: advicerequestId, organization: currentUserOrgId }, function(err, advicerequest) {
    if(err) {
      return res.ext.error(err).render();
    }

    if(!advicerequest) {
      return res.ext.error(errors['ADVICEREQUEST_NOT_FOUND']().m).render();
    }

    res.ext.data({ advicerequest: advicerequest.toObject() }).render();
  });
}



//get info +{
AdviceRequestController.prototype.getInfoForList = function(req, res) {

  var advicerequestList = req.body.adviceRequestList;


  if(!_.isArray(advicerequestList))  {
    return res.ext.error('Expected array').render();
  }

  var lookup = {
    $or: []
  };

  _.map(advicerequestList, function(ar) {

    if(_.isEmpty(ar.adviceRequestId) || _.isEmpty(ar.accessToken)) {

      return;
    }

    lookup.$or.push({

      _id: ar.adviceRequestId,
      accessToken: ar.accessToken

    });
  });

  if(lookup.$or.length === 0) {
    return res.ext.error('Invalid request data').render();
  }

  //AdviceRequestModel.find(lookup).sort({lastResponseDate: -1, modifiedDate: -1}).exec(function(err, advicerequests) {
  AdviceRequestModel.find(lookup).sort({lastResponseDate: -1, modifiedDate: -1}).exec(function(err, advicerequests) {  
    if(err) {
      return res.ext.error(err).render();
    }

    if(!advicerequests) {
      return res.ext.error(errors['ADVICEREQUEST_NOT_FOUND']().m).render();
    }

    res.ext.data({ advicerequests: advicerequests }).render();
  });
}
//get info +}

/*
///hnk+{
AdviceRequestController.prototype.getAllInfo = function(req, res) {
  var adviceRequests = req.extras.adviceRequests.asJSON();
  var lookup = {};
  var adviceRequestsTemp = req.extras.adviceRequests;

  console.log("hit the service");

  function Iterator(o, lookup){
    var k = Object.keys(o);
    console.log(k);
    return{
      next:function(){
        return k.shift();
      }
    }
  }

  Iterator(JSON.parse(adviceRequests), lookup);
  //var accessToken = req.query.token;
  // TODO: Add validations here

  AdviceRequestModel.find({query}, accessToken: advicerequests.accessToken , function(err, advicerequest) {
    if(err) {
      return res.ext.error(err).render();
    }

    if(!advicerequest) {
      return res.ext.error(errors['ADVICEREQUEST_NOT_FOUND']().m).render();
    }

    res.ext.data({ advicerequest: advicerequest.toObject() }).render();
  });
}
///hnk+}
*/

//HACK - AHL needs this 
AdviceRequestController.prototype.getAll = function(req, res) {
    AdviceRequestModel.findAllByOrg(req.extras.organization._id, function(err, advicerequests) {
    if(err) {
      return res.ext.error(err).render();
    }

    if(!advicerequests) {
      return res.ext.error(errors['ADVICEREQUEST_NOT_FOUND']().m).render();
    }

    res.ext.data({ advicerequests: advicerequests }).render();
  });
}

//helper function
function getMins(timeString){
  timeString = timeString.toLowerCase()
  tsArr = timeString.split(' ')
  var hm = tsArr[0].split(':')

  var mins = hm[1]
  var hours
  if(tsArr[1] == 'pm'){
    if(hm[0] != '12')
      hours = hm[0]*1 + 12
    else
      hours = 12
  }
  else{
    if(hm[0] != '12')
      hours = hm[0]*1
    else
      hours = 0
  }
  return parseInt(hours)*60 + parseInt(mins)
}

function shuffle(array) {
  var currentIndex = array.length
    , temporaryValue
    , randomIndex
    ;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

AdviceRequestController.prototype.newAdviceRequest = function(req, res) {

  var org = req.extras.organization.toObject();

  var newAdviceRequestAttrs = req.body;
  // TODO: Add validations here

  newAdviceRequestAttrs.organization = org._id;
  newAdviceRequestAttrs.reqstatus = "PRES";  ///why does this not work? 

  async.series({
    findSupporters : function(callback){

      OrgUserModel.find({orgId : req.extras.organization._id}).exec(function(err,orgusers){
        if(err)
          return callback('db query error occurred')

        orgusers = shuffle(orgusers)

        var now = moment()
        var day = now.format('dddd').toLowerCase()
        var minsToday = getMins(now.format('h:mm a'))
        var availableSupporters = []

        orgusers.forEach(function(orguser,i){
          if(availableSupporters.length < 5){
            var available = false
            orguser.times.forEach(function(time,j){
              if(time.day == day && time.begin <= minsToday && minsToday < time.end)
                available = true
            })
            if(available)
              availableSupporters.push(orguser._id)
          }
        })

        newAdviceRequestAttrs.assignedSupporters = availableSupporters
        newAdviceRequestAttrs.assignedSupportersCount = availableSupporters.length

        callback(null)
      })
    },

    newAdviceRequest : function(callback){

      AdviceRequestModel.new(newAdviceRequestAttrs, function(err, advicerequest) {
        if(err) {
          return res.ext.error(err).render();
        }

        advicerequest.assignedSupporters = newAdviceRequestAttrs.assignedSupporters
        advicerequest.assignedSupportersCount = newAdviceRequestAttrs.assignedSupportersCount
        // for now


        //hard code the domain (FOR NOW)
        
        //var domain = Utils.getDomainFromRequest(req);
        /*var accessPath = Config.getConfig().app.api.path
                          + '/organizations/' + org.orgURL
                          + '/advicerequest/' + advicerequest._id
                          + '?code=' + org.code
                          + '&token=' + advicerequest.accessToken;
        */
        var domain = 'http://domoapis.herokuapp.com/'
        var accessPath = org.orgURL
                         + '/giveadvice/' + advicerequest._id;


        ShortUrlModel.shorten(accessPath, function(err, shorturl) {
          if(shorturl) {
            // use short url
            advicerequest.accessURL = '/x/' + shorturl.shortURICode;

            // update doc with short url
            advicerequest.save(function(err) {
              if(err)   console.log(err);
            });

          } else {
            // something went wrong; use full url
            advicerequest.accessURL = accessPath;
          }

          advicerequest = advicerequest.toObject();

          // write response
          res.ext.data({ advicerequest: advicerequest }).render();

          // notify supportee if telNo was provided
          if(!!advicerequest.telephoneNumber) {
            advicerequest.accessURL = domain + advicerequest.accessURL;
            notifySupporteeSMS(org, advicerequest);
          }

          // full url for supporters
          advicerequest.accessURL = domain + accessPath;
          notifySupportersEmail(org, advicerequest);

          callback(null)
        });

      });
    }
  },function(err,ops){
      console.log('success')
    })
}


AdviceRequestController.prototype.newAdvice = function(req, res) {
  //res.ext.data({ user: req.user }).render();

  var org = req.extras.organization.toObject();  //link to org user

  newAdviceAttrs = req.body
  newAdviceAttrs.adviceGiverDisplayName = ((typeof req.extras.orguser == undefined || typeof req.extras.orguser.displayName == undefined) ? "Anonymous" : req.extras.orguser.displayName) 
  advicerequestId = req.params.advicerequest;

  var orguser = req.extras.orguser;
  if(!orguser) {
    return res.ext.error(errors['USER_NOT_FOUND']()).render();
  }

  if(!orguser.hasRole('supporter')) {
    return res.ext.error(errors['NOT_AUTHORISED']()).render();
  }

  AdviceRequestModel.newAdvice(req,advicerequestId, orguser._id, newAdviceAttrs, function(err, advicerequest, newAdvice){
    if(err) {
      return res.ext.error(err).render();
    }

    if(!advicerequest) {
      return res.ext.error(errors['ADVICEREQUEST_NOT_FOUND']()).render();
    }

    console.log('back to newAdvice in controller');
    //console.log(advicerequest);
    res.ext.data({ advicerequest: advicerequest }).render();

    if(!!advicerequest.subscriberId) {
      console.log("Notifying subscriber via push w. id: ",advicerequest.subscriberId);
      notifySupporteePush(advicerequest, newAdvice);
    }
  });

}


AdviceRequestController.prototype.listAdvice = function(req, res) {
  res.ext.data({ user: req.user }).render();
}


AdviceRequestController.prototype.setAdviceHelpful = function(req, res) {
  //res.ext.data({ user: req.user }).render();

  var newAdviceAttrs = req.body
   ,  advicerequestId = req.params.advicerequest
   ,  adviceId = req.params.advice
   ,  accessToken = req.query.token;

  console.log(advicerequestId);
  //console.log(req.user._id);
  console.log(adviceId);
  console.log(accessToken);

  AdviceRequestModel.setAdviceHelpful(advicerequestId, adviceId, accessToken, newAdviceAttrs, function(err, advicerequest){
    if(err) {
      return res.ext.error(err).render();
    }

    if(!advicerequest) {
      return res.ext.error(errors['ADVICEREQUEST_NOT_FOUND']()).render();
    }

    console.log('back to newAdvice in controller');
    //console.log(advicerequest);
    return res.ext.data({ advicerequest: advicerequest }).render();
  });
}


AdviceRequestController.prototype.setAdviceThankyou = function(req, res) {
  //res.ext.data({ user: req.user }).render();

  var newAdviceAttrs = req.body
   ,  advicerequestId = req.params.advicerequest
   ,  adviceId = req.params.advice
   ,  accessToken = req.query.token;

  console.log(advicerequestId);
  //console.log(req.user._id);
  console.log(adviceId);
  console.log(accessToken);

  AdviceRequestModel.setAdviceThankyou(advicerequestId, adviceId, accessToken, newAdviceAttrs, function(err, advicerequest){
    if(err) {
      return res.ext.error(err).render();
    }

    if(!advicerequest) {
      return res.ext.error(errors['ADVICEREQUEST_NOT_FOUND']()).render();
    }

    console.log('back to newAdvice in controller');
    //console.log(advicerequest);
    return res.ext.data({ advicerequest: advicerequest }).render();
  });
}
////////////////////////

AdviceRequestController.prototype.listAdvice = function(req, res) {
  res.ext.data({ user: req.user }).render();
}


function notifySupporteeSMS(org, advicerequest) {
  messenger.sendMessage({
    to: advicerequest.telephoneNumber,
    body: 'Thanks for using domo. Please use ' + advicerequest.accessURL + ' to track responses.'
  }, function(err) {
    if(err) {
      console.log('notifySupporteeSMS', err);
    } else {
      console.log('notifySupporteeSMS', 'success');
    }
  });

}


function notifySupporteePush(advicerequest, newAdvice) {

  newAdvice = _.pick(newAdvice, [ 'adviceResponse', 'adviceGiver', 'modifiedDate' ]);
  var message = newAdvice.adviceResponse;

  if(message.length > 25) {
    message = message.substring(0, 25) + '...';
  }
  
  //ALERT: it's 255 total chars, including all the {{:{}} mumbo jumbo!
  PushController.sendMessage({
    subscriberId: advicerequest.subscriberId,
    payload: { newAdviceForRequest: advicerequest._id },
    alert: 'New advice: ' + message
  }, function(err, devices) {
    console.log(err, devices); // do something here
  });
}


function notifySupportersEmail(org, advicerequest) {

  // notify supporters via email
  OrgUserModel.find({ orgId: org._id, "roles.supporter": { $exists: true } }).select('email').exec(function(err, orgusers) {
    if(err) {
      return console.log('Error fetching supporters:', err);
    }

    // build html for mail
    var config = Config.getConfig();
    var mailTmplPath = path.join(config.app.env.rootDir, 'views', 'mailer', 'newAdviceRequest.jade');

    jade.renderFile(mailTmplPath, { org: org, advicerequest: advicerequest }, function(err, mailHtml) {

      // run upto 5 parallel tasks to send e-mail
      async.eachLimit(orgusers, 5, function(orguser, next) {

        console.log('Sending message to supporter', orguser.email);

        mailer.sendMessage({
          to: orguser.email,
          subject: 'Domo: New Advice Request',
          html: mailHtml
        }, next);

      }, function(err) {
        if(err) {
          return console.log('Error notifying supporters:', err);
        }
      });

    });

  });
}



module.exports.AdviceRequestController = new AdviceRequestController();
