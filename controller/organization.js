var OrganizationModel = require("../model/organization").Organization
  , OrgUser = require('../model/orguser')
  , OrgUserModel = OrgUser.OrgUser
  , AdviceRequestModel = require('../model/advicerequest').AdviceRequest
  , Validator = require('validator').Validator
  , _ = require('lodash')
  , errors = require('../model/errors').errors
  , async = require('async')
  , Config = require('../configLoader')
  , jade = require('jade')
  , path = require('path')



var OrganizationController = function() {
};


OrganizationController.prototype.getAll = function(req, res) {
  var response = res.ext;
  response.view('data.jade').errorView('error.jade');

  var isTypeahead = (!!req.query.src && req.query.src === 'typeahead');

  var lookup = {};
  if(!!req.query.q) {
    // TODO: [SECURITY] sanitize req.query.src
    lookup.displayName = new RegExp(req.query.q, 'i');
  }

  OrganizationModel
    .find(lookup, { displayName: 1 })
    .select('id displayName orgURL').sort({ displayName: 'asc' })
    .exec(function(err, orgs) {
      if(err) {
        if(isTypeahead) {
          return res.json([]);
        }
        return response.error(err).render();
      }
      orgs = orgs || [];

      if(isTypeahead) {
        return res.json(orgs);
      }

      return response.data({ organizations: orgs }).json().render();
    });
}

OrganizationController.prototype.giveAdvice = function(req, res) {

  if(!req.extras.orguser)
    return res.ext.view('orgprofile.jade').render();

  async.series({
    findAssigned : function(callback){
      AdviceRequestModel.find({'assignedSupporters': { $all : req.extras.orguser._id } }).exec(function(err, adv){
        req.extras.orguser.assignedAdviceRequests = adv
        req.extras.orguser.assignedAdviceRequestsCount = adv.length
        callback(null)
      })
    },

    findAnswered : function(callback){
      AdviceRequestModel.find({'responses': { $elemMatch: { 'adviceGiver': req.extras.orguser._id} } }).exec(function(err, adv){
        req.extras.orguser.adviceGiven = adv
        req.extras.orguser.advcount = adv.length
        callback(null)
      })
    }

  },function(err,cbs){
    res.ext.data({ organization: req.extras.organization, orguser: req.extras.orguser})
    return res.ext.view('orgprofile.jade').render();
  })
}

OrganizationController.prototype.saveTimes = function(req, res) {
  if(!req.body.times)
    req.body.times = []

  OrgUserModel.findById(req.extras.orguser._id).exec(function(err,orguser){
    if(err)
      return res.send(500,{err : 'db query error'})

    console.log(orguser)
    console.log(req.body.times)

    orguser.times = req.body.times

    orguser.save(function(err,saved){
      if(!err)
        return res.send(200,{msg : 'success'})
    })
  })
}

OrganizationController.prototype.requests = function(req, res) {
  OrgUserModel.get(req.user._id, req.extras.organization._id, function(err, orguser) {
    if(err) {
      return res.ext.errorView('error.jade').error(err).render();
    }

    if(!orguser.accApproved) {
      return res.ext.view('supporterApprovalPending.jade').render();
    }

    return res.ext.view('giveadvice.jade').render();
  });
}


//going forward perhaps we'd like to pass the current version of the adviceRequest so that non-js & slow web connected devices can utilize
OrganizationController.prototype.giveAdviceDetail = function(req, res) {
  var advicerequestId = req.params.advicerequestId;
  console.log("advicerequestId in", advicerequestId);
  if (typeof advicerequestId == undefined || advicerequestId.length == 0 || advicerequestId == "adviceRequest"){
    console.log("here:",advicerequestId,".");
    //how to redirect errors, I don't know...
    console.log('whas?')
    return res.redirect('/mit');
  }
    

  OrgUserModel.get(req.user._id, req.extras.organization._id, function(err, orguser) {
    if(err) {
      return res.ext.errorView('error.jade').error(err).render();
    }

    if(!orguser.accApproved) {
      return res.ext.view('supporterApprovalPending.jade').render();
    }
     
    console.log("advicerequestId out", advicerequestId);
    return res.ext.data({ organization: req.extras.organization, orguser: req.extras.orguser, advicerequestId: advicerequestId }).view('giveadvicedetail.jade').render();
  });
}

OrganizationController.prototype.getAdvice = function(req, res) {
  return res.ext.view('getadvice.jade').render();
}

OrganizationController.prototype.getInfo = function(req, res) {
  var org = req.extras.organization.toObject();
  delete org.code;
  return res.ext.data({ organization: org }, true).view('orglanding').render();
}


OrganizationController.prototype.validateCode = function(req, res, next) {
  var response = res.ext;

  if(!req.query.code || !req.query.code.length) {
    return response.error('missing code').render();
  }

  // check org code. no need for db lookup
  if(req.query.code !== req.extras.organization.code) {
    return response.error('incorrect code').render();
  }

  // Correct org code
  next();
}


OrganizationController.prototype.codeCheck = function(req, res) {
  // code is already checked; write organization object as response
  res.ext.data({ organization: req.extras.organization });

  if (req.query.html !== 'true') {
    return res.ext.render();
  }

  var config = Config.getConfig();
  var tmplPath = path.join(config.app.env.rootDir, 'views', 'includes', 'getadviceForm.jade');
  jade.renderFile(tmplPath, {}, function (err, html) {
    if (html) {
      res.ext.data({ html: html });
    }
    return res.ext.render();
  });
}


OrganizationController.prototype.admin = function(req, res) {
  req.user.getToken(req.extras.clientId, true, true, function(err, user, token) {
    res.ext.data({ user: req.user, token: token }).view('admin/index').render();
  });
}


OrganizationController.prototype.getByOrgUrl = function(orgUrl, callback) {
  // lookup dbn
  OrganizationModel.getByOrgUrl(orgUrl, function(err, org) {
    if(err) {
      return callback(errors['ORG_NOT_FOUND'](err));
    }
    if(!org) {
      return callback(errors['ORG_NOT_FOUND']());
    }
    return callback(null, org);
  });
}



module.exports.OrganizationController = new OrganizationController();

