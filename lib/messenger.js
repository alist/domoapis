var twilio = require('twilio')
  , _ = require('lodash')


var allowedMsgAttrs = [
  'from',
  'to',
  'body'
];


var Messenger = function(){

};


Messenger.prototype.init = function(config) {
  if(_.isEmpty(config) || !_.isObject(config.service)) {
    throw new Error('Required: Messenger config');
  }

  this.config = config;
  this.service = twilio(config.service.sid, config.service.token);
  return this;
}



Messenger.prototype.isValid = function(msg, callback) {
  var options = this.config.options;

  var errorFields = [];
  var message = _.pick(msg, allowedMsgAttrs);

  if(_.isEmpty(message.from) || !_.isString(message.from)) {
    message.from = options.from;
  }

  _.each([ 'to', 'from', 'body' ], function(p) {
    if(!_.isString(message[p] || !message[p].length)) {
      errorFields.push(p);
    }
  });

  if(!errorFields.length) {
    return callback(null, message);
  }

  return callback(new Error('Required: ' + errorFields.join(',')));
}



Messenger.prototype.sendMessage = function(message, callback) {

  var self = this;
  this.isValid(message, function(err, validMessage) {
    if(err) {
      return callback(err);
    }

    self.service.sendSms(validMessage, function(error, res) {
      return callback(error);
    });

  });
}


var m = new Messenger();
module.exports = m;