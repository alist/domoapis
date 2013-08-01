var Validator = require('validator').Validator
  , config = require('../config').config
  , mailer = require('../lib/mailer')
  , Utils = require('../lib/utils')
  , Response = Utils.Response
  , ResponseStatus = Utils.ResponseStatus
  , _ = require('underscore')
  // , secrets = require('../secrets')
  , UserModel = require('../model/user').User;



var UserController = module.exports.UserController = function() {
}


UserController.prototype.register = function(req, res){
  var newUserAttrs = _.pick(req.body, ['email', 'password']);
  var validator = new Validator();
  validator.check(newUserAttrs.email, 'Invalid e-mail address').len(6, 64).isEmail();
  validator.check(newUserAttrs.password, 'Invalid password').len(5, 64);
  
  var response = Response(req, res);
    // Error handler
  var fnError = function(errors){
    if(!!errors)  response.error(errors);
    return response.render(
      ResponseStatus.BAD_REQUEST,
      'register.jade',
      _.extend(
        newUserAttrs,
        { title: 'Register' }
      )
    );
  }

  if(validator.hasError()){
    return fnError(validator.getErrors()).done();
  }
  
  //newUserAttrs.roles = [ this.primaryRole ]; //hnk07/23/13-

  var self = this;

  UserModel.register(newUserAttrs, function(err, user){
    if(err){
      return fnError(err).done();
    }

    req.logIn(user, function(err) {
      if (err){
        return fnError(err).done();
      }
      self.sendApprovalEmail(req, res);
      // Route handler for / will read req.user to check if user has been approved, and will use the appropriate template
      return response.redirect('/').done();
    });

  });
}


//UserController.prototype.auth = function(email, password, done){ //hnk07/23/13-
UserController.prototype.auth = function(email, password, permissions, done){ //hnk07/23/13+
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

UserController.prototype.sendApprovalEmail = function(req, res){
  // User shouldn't have to wait for e-mail to be dispatched
  // E-mail sending needs to be a part of a larger queue-based subsystem anyway
  console.log('Sending approval-request email')
  mailer.dispatchApprovalMail(Utils.getDomainFromRequest(req), req.user,
    function(err){
      if(err)   return console.log("Sending email: Error: " + err);
      console.log("Dispatched approval-request e-mail to: " + config.mailConfig.adminEmails.join(', '));
    });
}


UserController.prototype.approveAccount = function(req, res){
  var email = req.query.email;
  var userApprovalHash = req.query.token;
  
  var validator = new Validator();
  validator.check(email).len(6, 64).isEmail();
  validator.check(userApprovalHash).notNull().notEmpty();
  var errors = validator.getErrors();
  if(errors.length){
    return Response(req, res).render(ResponseStatus.BAD_REQUEST, 'error.jade', { title: 'Invalid Approval Link', email: (email || ''), errors: errors }).done();
  }

  // maybe this should display a page that shows a Yes/No action?
  var self = this;
  UserModel.approveAccount({ 'userID': email, 'userApprovalHash': userApprovalHash, userApproved: false },
    function(err, updates){
      if(err){
        return Response(req, res).render(ResponseStatus.BAD_REQUEST, 'error.jade', { title: 'Invalid Approval Link', email: (email || ''), errors: [err] }).done();
      }
      // Reusing 'error' template for now
      errors.push('Account for ' + email + ' approved successfully.');
      return Response(req, res).render(ResponseStatus.BAD_REQUEST, 'error.jade', { title: 'Account Approved', email: (email || ''), errors: errors }).done();
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
