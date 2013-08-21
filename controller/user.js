var Validator = require('validator').Validator
  , mailer = require('../lib/mailer')
  , Utils = require('../lib/utils')
  , _ = require('lodash')
  , UserModel = require('../model/user').User
  , OrgUserModel = require('../model/orguser').OrgUser
  , Config = require('../configLoader')
  , jade = require('jade')
  , path = require('path')
  , async = require('async')



var UserController = function() {
}


UserController.prototype.getRegister = function(req, res){

  res.ext.view('register')
    .viewData({ apiOrgUrl: Config.getConfig().app.api.path + "/organizations?src=typeahead" })

  var reqOrg;
  if(!!req.extras && !_.isEmpty(req.extras.organization) && !req.extras.organization.error) {
    reqOrg = req.extras.organization;
    res.ext.viewData({ disableOrgSel: true, orgId: reqOrg.id, org: reqOrg.displayName });
  }

  res.ext.render();
}


UserController.prototype.register = function(req, res){
  var newUserAttrs = _.pick(req.body, [ 'email', 'password', 'skills', 'orgId', 'org' ]);
  var reqOrg;
  if(!!req.extras && !_.isEmpty(req.extras.organization) && !req.extras.organization.error) {
    reqOrg = req.extras.organization;
  }

  var validator = new Validator();
  validator.check(newUserAttrs.email, 'Invalid e-mail address').len(6, 64).isEmail();
  validator.check(newUserAttrs.password, 'Invalid password').len(5, 64);
  validator.check(newUserAttrs.orgId, 'Invalid organization').notEmpty();
  
  var response = res.ext;
  response.errorView('register.jade');
  response.viewData({ apiOrgUrl: Config.getConfig().app.api.path + "/organizations?src=typeahead" })
  response.viewData(newUserAttrs);

  if(reqOrg) {
    response.viewData({ disableOrgSel: true, orgId: reqOrg.id, org: reqOrg.displayName });
  }

  if(validator.hasError()){
    return response.error(validator.getErrors()).render();
  }

  var self = this;

  newUserAttrs.roles = {
    supporter: {
      skills: newUserAttrs.skills,
      joined: new Date()
    }
  };

  delete newUserAttrs.skills;

  UserModel.register(newUserAttrs, function(err, user, orguser, org){
    if(err){
      return response.error(err).render();
    }

    req.logIn(user, function(err) {
      if (err){
        return response.error(err).render();
      }

      // async, don't wait for email to be dispatched
      self.sendApprovalEmail(req, {
        user: user,
        org: org
      }, function(err){
        if(err) {
          console.log(err);
        }
      });
      
      return response.data(user.toObject()).data(orguser.toObject()).redirect('/');
    });
  });
}


UserController.prototype.auth = function(email, password, done){
  var validator = new Validator();
  validator.check(email, 'Invalid e-mail address.').notEmpty().len(5, 64);
  validator.check(password, 'Invalid password.').notEmpty().len(5, 64);

  if(validator.hasError()){
    return done(null, false, { message: validator.getErrors().join(' ') });
  }
  
  return UserModel.getAuthenticated(email, password,
    function(err, user){
      if(err) return done(null, false, { message: err });
      //get user permissions? hnk07/23/13+
      return done(null, user);
    });
}


UserController.prototype.sendApprovalEmail = function(req, data, callback){

  var config = Config.getConfig();
  var adminEmails = config.mail.adminEmails.join(','); // for now

  async.waterfall([
    // fetch populated orguser
    function(next) {
      OrgUserModel.getPopulated(data.user._id, data.org._id, function(err, orguser) {
        data.orguser = orguser;
        next(err);
      });
    },
    // generate html from jade template
    function(next) {

      data.approvalLink = Utils.getDomainFromRequest(req)
        + '/o/' + data.org._id
        + '/u/' + data.user._id
        + '/account/approval?token='
        + data.orguser.accApprovalHash;

      var tmplPath = path.join(config.app.env.rootDir, 'views', 'mailer', 'approveSupporter.jade');
      jade.renderFile(tmplPath, data, next);
    },
    // mail
    function(html, next) {
      var parcel = {
        title: 'Account activation for ' + data.user.email,
        to: adminEmails,
        subject: 'Domo: Account Approval Request',
        html: html
      };

      mailer.sendMessage(parcel, next);
    }
  ], callback); 
}


UserController.prototype.approveAccount = function(req, res){

  var approvalAttrs = {
    userId: req.params.userId,
    orgId: req.params.orgId,
    token: req.query.token
  };
  
  var validator = new Validator();
  validator.check(approvalAttrs.userId).notEmpty().len(6, 64);
  validator.check(approvalAttrs.orgId).notEmpty().len(6, 64);
  validator.check(approvalAttrs.token).notNull().notEmpty();

  var response = res.ext;
  response.errorView('error.jade');
  response.viewData({ title: 'Invalid Approval Link' });

  if(validator.hasError()){
    return response.error(validator.getErrors()).debug().render();
  }

  var self = this;
  OrgUserModel.approveAccount(approvalAttrs, function(err, orguser){
    if(err){
      return response.error(err).debug().render();
    }
    response.flash('accApproved', true);
    response.flash('roles', _.keys(orguser.roles.toObject()));
    return response.redirect('/');
  });
}


UserController.prototype.logout = function(req, res){

}

UserController.prototype.findUserById = function(userId, callback){
  UserModel.getUser({ 'userID': userId },
    function(err, user){
      if(err) return callback(err);
      return callback(null, user);
    });
}


module.exports.UserController = new UserController();
