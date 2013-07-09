var Validator = require('validator').Validator
  , mailer = require('../lib/mailer')
  , Utils = require('../lib/utils')
  , Response = Utils.Response
  , ResponseStatus = Utils.ResponseStatus
  , _ = require('underscore')
  , secrets = require('../secrets');


var UserController = function(userType) {

  if(!userType || userType.length == 0){
    throw new Error("You must specify a UserController type.");
  }
  var baseUserModel = require('../model/user2');

  this.userType = userType;
  this.UserModel = baseUserModel.call(undefined, userType);
}

UserController.prototype.register = function(req, res){
  var newUserAttrs = _.pick(req.body, ['username', 'password', 'email', 'skills']);
  var validator = new Validator();
  //validator.check(newUserAttrs.username, 'Invalid username address').len(6, 64);
  validator.check(newUserAttrs.email, 'Invalid e-mail address').len(6, 64).isEmail();
  validator.check(newUserAttrs.password, 'Invalid password').len(5, 64);

  var errors = validator.getErrors();
  if(errors.length){
    return Response(req, res).render(ResponseStatus.BAD_REQUEST, 'register.jade', _.extend(newUserAttrs, { title: 'Register', errors: errors }));
  }

  var self = this;

  self.UserModel.getUser(self.userType, { 'username': newUserAttrs.username })
    .then(function(user){
      errors.push(newUserAttrs.username + " is already a registered username.");
      return Response(req, res).render(ResponseStatus.BAD_REQUEST, 'register.jade', _.extend(newUserAttrs, { title: 'Register', errors: errors }));
    })
    .fail(function(err){

      if(err instanceof Error && err.message === 'USER_NOT_FOUND'){
        self.UserModel.register(self.userType, newUserAttrs)
          .then(function(user){

            req.logIn(user, function(err) {
              if (err){
                errors.push(err);
                return Response(req, res).render(ResponseStatus.BAD_REQUEST, 'register.jade', _.extend(newUserAttrs, { title: 'Register', errors: errors }));
              }
              self.sendApprovalEmail(req, res);
              // Route handler for / will read req.user to check if user has been approved, and will use the appropriate template
              return Response(req, res).redirect('/');
            });
            
          })
          .fail(function(err){
            errors.push(err);
            return Response(req, res).render(ResponseStatus.BAD_REQUEST, 'register.jade', _.extend(newUserAttrs, { title: 'Register', errors: errors }));
          })
          .done();
      } else {
        errors.push(err);
        return Response(req, res).render(ResponseStatus.BAD_REQUEST, 'register.jade', _.extend(newUserAttrs, { title: 'Register', errors: errors }));
      }

    })
    .done();
}


UserController.prototype.auth = function(username, password, done){
  var validator = new Validator();
  validator.check(username, 'Invalid username.').notEmpty().len(5, 64);
  validator.check(password, 'Invalid password.').notEmpty().len(5, 64);

  var errors = validator.getErrors();
  if(errors.length){
    console.log(errors);
    return done(null, false, { message: errors.join(' ') });
  }
  
  return this.UserModel.getAuthenticated(this.userType, username, password)
    .then(function(user){
      return done(null, user);
    }.bind(this))
    .fail(function(err){
      console.log(err);
      return done(null, false, { message: err });
    });
}


UserController.prototype.confirmEmail = function(req, res) {
  var validator = new Validator();
  validator.check(req.body.email, 'Please enter a valid e-mail address').len(6, 64).isEmail();

  var errors = validator.getErrors();   
  if(errors.length){
    return Response(req, res).render(ResponseStatus.BAD_REQUEST, 'registerConfirmEmail', { title: 'Confirm E-mail Address', email: (req.body.email || ''), errors: errors });
  }

  var self = this;
  // Update e-mail in database, send mail
  self.UserModel.updateEmail(self.userType, !!req.user.password, { id: req.user.id }, req.body.email)
    .then(function(updates){
      if(req.user){
        req.logIn(req.user, function(err) {
          if (err){
            errors.push(err);
            return Response(req, res).render(ResponseStatus.BAD_REQUEST, 'error.jade', { title: 'Error Confirming E-mail Address', email: (req.body.email || ''), errors: [err] });
          }
          self.sendVerifEmail(req, res);
        });
      }
    })
    .fail(function(err){
      return Response(req, res).render(ResponseStatus.BAD_REQUEST, 'registerConfirmEmail', { title: 'Confirm E-mail Address', email: req.body.email, errors: [err] });
    })
    .done();
}

UserController.prototype.verifyEmail = function(req, res){
  var email = req.query.email;
    var emailVerificationHash = req.query.token;
  
  var validator = new Validator();
    validator.check(email).len(6, 64).isEmail();
    validator.check(emailVerificationHash).notNull().notEmpty();
    var errors = validator.getErrors();
    if(errors.length){
      return Response(req, res).render(ResponseStatus.BAD_REQUEST, 'error.jade', { title: 'Invalid Verification Link', email: (email || ''), errors: errors });
    }

    var self = this;
    self.UserModel.verifyEmail(self.userType, { 'email': email, 'emailVerificationHash': emailVerificationHash, emailVerified: false })
      .then(function(updates){
        if(req.user){
          req.logIn(req.user, function(err) {
            if (err){
              errors.push(err);
              return Response(req, res).render(ResponseStatus.BAD_REQUEST, 'error.jade', { title: 'Error Verifying Account', email: (email || ''), errors: [err] });
            }
            self.sendVerifEmail(req, res);
          });
        }
        // TODO: Display appropriate message
        // May be redir'd to login, if user is not logged in
        Response(req, res).redirect('/');
      }.bind(this))
      .fail(function(err){
        return Response(req, res).render(ResponseStatus.BAD_REQUEST, 'error.jade', { title: 'Invalid Verification Link', email: (email || ''), errors: [err] });
      })
      .done();
}

UserController.prototype.verifyEmailStatus = function(email, callback){
  var validator = new Validator();
    validator.check(email).len(6, 64).isEmail();
    var errors = validator.getErrors();
    if(errors.length){
      return callback(new Error('Invalid email'));
  }

  this.UserModel.getUser(this.userType, { 'email': email, emailVerified: true })
  .then(function(user){
    callback(null, user);
  })
  .fail(function(err){
    callback(err.message || 'error');
  })
  .done();
}

UserController.prototype.sendApprovalEmail = function(req, res){
  // User shouldn't have to wait for e-mail to be dispatched
  // E-mail sending needs to be a part of a larger queue-based subsystem anyway
  console.log('Sending approval-request email')
  mailer.dispatchApprovalMail(Utils.getDomainFromRequest(req), req.user)
    .then(function(){
      console.log("Dispatched approval-request e-mail to: " + secrets.mailConfig.adminEmails.join(', '));
    })
    .fail(function(err){
      console.log("Sending email: Error: " + err);
    })
    .done();
}


UserController.prototype.approveAccount = function(req, res){
  var email = req.query.email;
  var userApprovalHash = req.query.token;
  
  var validator = new Validator();
  validator.check(email).len(6, 64).isEmail();
  validator.check(userApprovalHash).notNull().notEmpty();
  var errors = validator.getErrors();
  if(errors.length){
    return Response(req, res).render(ResponseStatus.BAD_REQUEST, 'error.jade', { title: 'Invalid Approval Link', email: (email || ''), errors: errors });
  }
  console.log(errors)
  // maybe this should display a page that shows a Yes/No action?
  var self = this;
  self.UserModel.approveAccount('user', { 'email': email, 'userApprovalHash': userApprovalHash, userApproved: false })
    .then(function(updates){
      // Reusing 'error' template for now
      errors.push('Account for ' + email + ' approved successfully.');
      console.log(errors)
      return Response(req, res).render(ResponseStatus.BAD_REQUEST, 'error.jade', { title: 'Account Approved', email: (email || ''), errors: errors });
    })
    .fail(function(err){
      console.log(err)
      return Response(req, res).render(ResponseStatus.BAD_REQUEST, 'error.jade', { title: 'Invalid Approval Link', email: (email || ''), errors: [err] });
    })
    .done();
}

UserController.prototype.getVerifPendingMsg = function(req){
  var response = { title: 'Pending Verification', statusType: 'verifPending', email: req.user.email };
  response.message = 'Please check your e-mail (' + req.user.email + ') to complete the sign-up process. <a href="/' + this.userType + '/account/verification/resend">Click here</a> to resend the verification e-mail.';
  return response;
}


UserController.prototype.sendVerifEmail = function(req, res){

  // User shouldn't have to wait for e-mail to be dispatched
  // E-mail sending needs to be a part of a larger queue-based subsystem anyway
  console.log('TBD: Sending verif email')
  // mailer.dispatchVerifMail(Utils.getDomainFromRequest(req), req.user)
  //   .then(function(){
  //     // logger.info("Dispatched e-mail: " + req.user.email);
  //   })
  //   .fail(function(err){
  //     // logger.error("Sending email: Error: " + err);
  //   })
  //   .done();
  // var response = this.getVerifPendingMsg(req);
  // req.flash('response', response);
    return Response(req, res).redirect('/');
}

UserController.prototype.status = function(req, res){
  var response = req.flash('response');
  if(!response || !response.length){
    return Response(req, res).redirect('/');
  }
  if(response.length && response.length > 0){
    response = response[0];
  }

  response.userType = this.userType;

  if(typeof response.errors !== 'undefined'){
    return Response(req, res).render(ResponseStatus.BAD_REQUEST, 'status', response);
  }
  return Response(req, res).render('status', response);
}

UserController.prototype.resetPasswordForm = function(req, res){
  var email = req.query.email;
  var recoverPasswordHash = req.query.token;

  var validator = new Validator();
    validator.check(email).len(6, 64).isEmail();
    validator.check(recoverPasswordHash).notNull().notEmpty();
    var errors = validator.getErrors();
    if(errors.length){
      return Response(req, res).render(ResponseStatus.BAD_REQUEST, 'resetPassword', { title: 'Invalid Recovery Link', email: (email || ''), errors: errors });
    }

    this.UserModel.getUser(this.userType, { 'email': email, 'recoverPasswordHash': recoverPasswordHash }, 'email profile recoverPasswordHash')
    .then(function(user){
      return Response(req, res).render('resetPassword', { title: 'Reset Password', email: email, recoverPasswordHash: recoverPasswordHash });
    }.bind(this))
    .fail(function(err){
      return Response(req, res).render(ResponseStatus.BAD_REQUEST, 'resetPassword', { title: 'Invalid Recovery Link', email: (email || ''), errors: [err] });
    })
    .done();
}

UserController.prototype.resetPassword = function(req, res){
  var email = req.body.email;
  var recoverPasswordHash = req.body.token;
  var newPassword = req.body.password;

  var validator = new Validator();
  validator.check(newPassword).len(5, 64);
    validator.check(email).len(6, 64).isEmail();
    validator.check(recoverPasswordHash).notNull().notEmpty();
    var errors = validator.getErrors();
    if(errors.length){
      return Response(req, res).render(ResponseStatus.BAD_REQUEST, 'resetPassword', { title: 'Invalid Recovery Link', email: (email || ''), errors: errors });
    }

    this.UserModel.updatePassword(this.userType, { 'email': email, 'recoverPasswordHash': recoverPasswordHash }, newPassword)
      .then(function(updates){
        if(req.user){
          this.updateSession(req, updates);
        }
        Response(req, res).redirect('/login', { 'message': 'Password reset successfully.' });
      }.bind(this))
      .fail(function(err){
        return Response(req, res).render(ResponseStatus.BAD_REQUEST, 'resetPassword', { title: 'Invalid Recovery Link', email: (email || ''), errors: [err] });
      })
      .done();
}

UserController.prototype.requestRecovery = function(req, res){
  var email = req.body.email;
  
  var validator = new Validator();
    validator.check(email).len(6, 64).isEmail();
    var errors = validator.getErrors();
    if(errors.length){
      return Response(req, res).render(ResponseStatus.BAD_REQUEST, 'forgotPassword', { title: 'Forgot Password', email: (email || ''), errors: errors });
    }

    this.UserModel.getUser(this.userType, { 'username': email, 'password': { $exists: true } }, 'email profile recoverPasswordHash')
    .then(function(user){

      mailer.dispatchRecoveryMail(Utils.getDomainFromRequest(req), user)
        .then(function(){
          // logger.info("Dispatched e-mail: " + user.email);
        })
        .fail(function(err){
          // logger.error("Sending email (" + user.email + "): Error: " + err);
        })
        .done();

        var response = { title: 'Recovery Link Sent', statusType: 'accountRecovery', email: user.email };
        response.message = "Please check your e-mail (" + user.email + ") for instructions to regain access to your account.";
        req.flash('response', response);
        return Response(req, res).redirect('/' + this.userType + '/account/recovery/status', response);

    }.bind(this))
    .fail(function(err){
      return Response(req, res).render(ResponseStatus.BAD_REQUEST, 'forgotPassword', { title: 'Forgot Password', email: (email || ''), errors: [err] });
    })
    .done();
}


UserController.prototype.logout = function(req, res){

}

UserController.prototype.findUserById = function(userId, callback){

  this.UserModel.getUser(this.userType, { 'id': userId })
    .then(function(user){
      callback(null, user);
    }.bind(this))
    .fail(function(err){
      callback(err);
    })
    .done();
}

var userTypes = require('../secrets').userTypes;
var exportName;

// exports a controller for each userType 
// ['user', 'therapist'] => UserAccountController, SupporterAccountController
userTypes.forEach(function(ut){
  exportName = ut.charAt(0).toUpperCase() + ut.slice(1) + "AccountController";
  module.exports[exportName] = new UserController(ut);
});

// If any component needs to extend defn
module.exports.base = UserController;