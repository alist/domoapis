var nodemailer = require('nodemailer')


var Mailer = function(){
};

Mailer.prototype.init = function(mailConfig) {
  this.mailConfig = mailConfig;
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


var m = new Mailer();
module.exports = m;