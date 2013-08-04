var Validator = require('validator').Validator
  , config = require('../config').config
  , mailer = require('../lib/mailer')
  , Utils = require('../lib/utils')
  , _ = require('lodash')
  // , secrets = require('../secrets')
  , UserModel = require('../model/user').User;



var UserController = module.exports.UserController = function() {
}


UserController.prototype.register = function(req, res){
  var newUserAttrs = _.pick(req.body, ['email', 'password']);
  var validator = new Validator();
  validator.check(newUserAttrs.email, 'Invalid e-mail address').len(6, 64).isEmail();
  validator.check(newUserAttrs.password, 'Invalid password').len(5, 64);
  
  var response = res.ext;
  response.errorView('register.jade');
  response.viewData(_.extend(newUserAttrs, { title: 'Register' }));

  if(validator.hasError()){
    return response.error(validator.getErrors()).render();
  }
  
  //newUserAttrs.roles = [ this.primaryRole ]; //hnk07/23/13-

  var self = this;

  UserModel.register(newUserAttrs, function(err, user){
    if(err){
      return response.error(err).render();
    }

    req.logIn(user, function(err) {
      if (err){
        return response.error(err).render();
      }
      self.sendApprovalEmail(req, res);
      // Route handler for / will read req.user to check if user has been approved, and will use the appropriate template
      return response.redirect('/');
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




UserController.prototype.logout = function(req, res){

}

UserController.prototype.findUserById = function(userId, callback){
  UserModel.getUser({ 'userID': userId },
    function(err, user){
      if(err) return callback(err);
      return callback(null, user);
    });
}
