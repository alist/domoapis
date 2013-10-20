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


AdviceRequestController.prototype.getInfoForList = function(req, res) {

  var advicerequestList = req.body;

  if(!_.isArray(advicerequestList))  {
    return res.ext.error('Expected array').render();
  }

  var lookup = {
    $or: []
  };

  _.map(advicerequestList, function(ar) {

    if(_.isEmpty(ar.advicerequestId) || _.isEmpty(ar.token)) {
      return;
    }

    lookup.$or.push({
      _id: ar.advicerequestId,
      accessToken: ar.token
    });
  });

  if(lookup.$or.length === 0) {
    return res.ext.error('Invalid request data').render();
  }

  AdviceRequestModel.find(lookup).sort('-modifiedDate').exec(function(err, advicerequests) {
    if(err) {
      return res.ext.error(err).render();
    }

    if(!advicerequests) {
      return res.ext.error(errors['ADVICEREQUEST_NOT_FOUND']().m).render();
    }

    res.ext.data({ advicerequests: advicerequests }).render();
  });
}


AdviceRequestController.prototype.newAdviceRequest = function(req, res) {

  var org = req.extras.organization.toObject();

  var newAdviceRequestAttrs = req.body;
  // TODO: Add validations here

  newAdviceRequestAttrs.organization = org._id;

  AdviceRequestModel.new(newAdviceRequestAttrs, function(err, advicerequest) {
    if(err) {
      return res.ext.error(err).render();
    }

    // for now
    var domain = Utils.getDomainFromRequest(req);
    var accessPath = Config.getConfig().app.api.path
                      + '/organizations/' + org.orgURL
                      + '/advicerequest/' + advicerequest._id
                      + '?code=' + org.code
                      + '&token=' + advicerequest.accessToken;

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
    });

  });

}


AdviceRequestController.prototype.newAdvice = function(req, res) {
  //res.ext.data({ user: req.user }).render();

  var org = req.extras.organization.toObject();  //link to org user

  var newAdviceAttrs = req.body
   ,  advicerequestId = req.params.advicerequest;

  console.log(advicerequestId);
  console.log(req.user._id);
  console.log(org._id);

  var orguser = req.extras.orguser;
  if(!orguser) {
    return res.ext.error(errors['USER_NOT_FOUND']()).render();
  }

  if(!orguser.hasRole('supporter')) {
    return res.ext.error(errors['NOT_AUTHORIZED'('not a supporter')]).render();
  }

  AdviceRequestModel.newAdvice(advicerequestId, orguser._id, newAdviceAttrs, function(err, advicerequest, newAdvice){
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

  PushController.sendMessage({
    subscriberId: advicerequest.subscriberId,
    payload: { newAdvice: newAdvice },
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
