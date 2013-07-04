var nodemailer = require('nodemailer')
  , Q = require('q')
  , mailConfig = require ('../secrets').mailConfig;
  

var Mailer = function(){
  this.transport = nodemailer.createTransport("SMTP", mailConfig);
};

Mailer.prototype.sendMessage = function(message) {
  var deferred = Q.defer();
  message.from = mailConfig.from;
  try{
    this.transport.sendMail(message, deferred.makeNodeResolver());
  }catch(e){
    deferred.reject(e);
  }
  return deferred.promise;
}


Mailer.prototype.getSendToAddr = function(user) {
  var fullName = user.profile && ((user.profile.fname || '') + " " + (user.profile.lname || ''));
  var sendTo = '';
  if('string' === typeof fullName && fullName.trim().length){
    sendTo = (fullName.trim().length ? "'" + fullName.trim() + "'" : "")  + " <" + user.email + ">";
  } else {
    sendTo = user.email;
  }
  return sendTo;
}


Mailer.prototype.dispatchRecoveryMail = function(domain, user){

  var sendTo = this.getSendToAddr(user);
  var recovLink = domain + '/' + user.userType + '/account/recovery?token=' + user.recoverPasswordHash + '&email=' + user.email;

  // TODO: read from mail template
  var recovEmail = {
    to: sendTo,
    subject: 'BuggyCoder: Reset Password',
    text: 'Click on the following link to reset the password for your account: ' + recovLink,
    html: 'Click on the following link to reset the password for your account:<br/><a href="' + recovLink + '">' + recovLink + '</a>'
  };
  
  // Returns a promise
  return this.sendMessage(recovEmail);
}


Mailer.prototype.dispatchVerifMail = function(domain, user){

  var sendTo = this.getSendToAddr(user);
  var verifLink = domain + '/' + user.userType + '/account/verification?token=' + user.emailVerificationHash + '&email=' + user.email;
  
  // TODO: read from mail template
  var verifEmail = {
    to: sendTo,
    subject: 'Domo: E-mail Verification',
    text: 'Welcome to Domo! Click on the following link to activate your account: ' + verifLink,
    html: 'Welcome to Domo!<br/><br/>Click on the following link to activate your account:<br/><a href="' + verifLink + '">' + verifLink + '</a>'
  };
  // Returns a promise
  return this.sendMessage(verifEmail);
}

Mailer.prototype.dispatchApprovalMail = function(domain, user){

  var sendTo = mailConfig.adminEmails.join(', ');
  var approveLink = domain + '/' + user.userType + '/account/approval?token=' + user.userApprovalHash + '&email=' + user.email;
  
  // TODO: read from mail template
  var approveEmail = {
    to: sendTo,
    subject: 'Domo: Account Approval Request',
    text: 'The following user wishes to be a supporter: \r\n' + JSON.stringify(user) + '\r\nClick on the following link to approve the account: ' + approveLink,
    html: 'The following user wishes to be a supporter:<br/><br/><pre>' + JSON.stringify(user) + '</pre>Click on the following link to activate your account:<br/><a href="' + approveLink + '">' + approveLink + '</a>'
  };
  // Returns a promise
  return this.sendMessage(approveEmail);
}

var m = new Mailer();
module.exports = m;