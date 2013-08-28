var AdviceRequestModel = require("../model/advicerequest").AdviceRequest
  , Organization = require('../controller/organization').OrganizationController
  , OrgUserModel = require('../model/orguser').OrgUser
  , ShortUrlModel = require('../model/shorturl').ShortUrl
  , mailer = require('../lib/mailer')
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

    res.ext.data(advicerequest.toObject()).render();
  });
}


AdviceRequestController.prototype.newAdviceRequest = function(req, res) {

  var org = req.extras.organization;

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

      // full url for supportees
      advicerequest.accessURL = domain + accessPath;
      notifySupportersEmail(org.toObject(), advicerequest);
    });

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