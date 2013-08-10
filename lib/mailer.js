var nodemailer = require('nodemailer')
  , Config = require('../configLoader')
  

var Mailer = function(){
};

Mailer.prototype.init = function() {
  this.mailConfig = Config.getConfig().mail;
  this.transport = nodemailer.createTransport("SMTP", this.mailConfig);
}

Mailer.prototype.sendMessage = function(message, callback) {
  message.from = this.mailConfig.from;
  try{
    this.transport.sendMail(message, callback);
  }catch(e){
    callback(e);
  }
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


Mailer.prototype.dispatchRecoveryMail = function(domain, user, callback){

  var sendTo = this.getSendToAddr(user);
  var recovLink = domain + '/account/recovery?token=' + user.recoverPasswordHash + '&email=' + user.email;

  // TODO: read from mail template
  var recovEmail = {
    to: sendTo,
    subject: 'Domo: Reset Password',
    text: 'Click on the following link to reset the password for your account: ' + recovLink,
    html: 'Click on the following link to reset the password for your account:<br/><a href="' + recovLink + '">' + recovLink + '</a>'
  };

  return this.sendMessage(recovEmail, callback);
}


Mailer.prototype.dispatchVerifMail = function(domain, user, callback){

  var sendTo = this.getSendToAddr(user);
  var verifLink = domain + '/account/verification?token=' + user.emailVerificationHash + '&email=' + user.email;
  
  // TODO: read from mail template
  var verifEmail = {
    to: sendTo,
    subject: 'Domo: E-mail Verification',
    text: 'Welcome to Domo! Click on the following link to activate your account: ' + verifLink,
    html: 'Welcome to Domo!<br/><br/>Click on the following link to activate your account:<br/><a href="' + verifLink + '">' + verifLink + '</a>'
  };

  return this.sendMessage(verifEmail, callback);
}

Mailer.prototype.dispatchApprovalMail = function(domain, user, callback){

  var sendTo = this.mailConfig.adminEmails.join(', ');
  var approveLink = domain + '/account/approval?token=' + user.userApprovalHash + '&email=' + user.email;
  
  // TODO: read from mail template, or create a mustache?
  var approveEmail = {
    to: sendTo,
    subject: 'Domo: Account Approval Request',
    text: 'The following user wishes to be a supporter: \r\n' + JSON.stringify(user) + '\r\nClick on the following link to approve the account: ' + approveLink,
    html: 'The following user wishes to be a supporter:<br/><br/><pre>' + JSON.stringify(user) + '</pre>Click on the following link to activate your account:<br/><a href="' + approveLink + '">' + approveLink + '</a>'
  };

  return this.sendMessage(approveEmail, callback);
}

var m = new Mailer();
module.exports = m;