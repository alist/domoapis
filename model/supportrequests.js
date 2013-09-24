var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = mongoose.Types.ObjectId
  , bcrypt = require('bcrypt')
  , uuid = require('node-uuid')
  , crypto = require('crypto')
  , errors = require('./errors').errors
  // , Organizations = require('./organization').Organization


exports.userLoginURLBase = "https://oh.domo.io/urllogin?token=";


var SALT_WORK_FACTOR = 10;

var supportRequestSessionSchema = new Schema({

  authToken: {type: String},
  accessToken: {type: String, index: {unique: true}},
  supportAreas: [ { identifier: String, name: String } ],
  telephoneNumber: {type: String, index: {unique: false}},
  telephoneVerifyDate: {type: Date},
  telephoneNumberVerifyAttemptCount: {type: Number},
  telelphoneVerifyCode: {type: String},
  messageCount: {type: Number}, //how many msgs they've received
  overIntervalMessageAllowanceCount: {type: Number}, //how many msgs allowed to be sent past the notification interval
  lastNotificationDate: {type: Date, index: {unique: false}},
  notificationInterval: {type: Number}
});


supportRequestSessionSchema.statics.findAll = function(lookupQuery, selectFields, callback){
  this.findOne(lookupQuery).select(selectFields).exec(function(err, user){
    if(err) return callback(err);
    if(user) return callback(null, user);

    return callback(errors['SESSION_NOT_FOUND'](lookupQuery));
  });
}

genCode = function(length, salt) {
  var current_date, hash, random;
  current_date = (new Date()).valueOf().toString();
  random = Math.random().toString();
  hash = crypto.createHash('sha1').update(current_date + random + salt).digest('base64');
  hash = hash.replace(/\//g, '');
  if (length > hash.length) {
    return hash;
  } else {
    return hash.substr(0, length);
  }
};

exports.getsupportRequestSessionWithAuthToken = function(authToken, callback) {
  if ((authToken != null) === false) {
    callback("no auth token provided for this session");
    return;
  }
  return SupportRequestSession.findOne({
    authToken: authToken
  }, {}, function(err, user) {
    if ((err != null) || (user != null) === false) {
      return callback("no user found for token: " + token);
    } else {
      return callback(null, user);
    }
  });
};

exports.allsupportRequestSessions = function(callback) {
  var _this = this;
  return SupportRequestSession.find({}, {}, function(err, supportRequestSessions) {
    return callback(err, supportRequestSessions);
  });
};

exports.newsupportRequestSession = function(authToken, accessToken, telephoneNumber, callback) {
  var supportRequestSession, supportRequestSessionProperties,
    _this = this;
  supportRequestSessionProperties = {
    "authToken": authToken,
    "acceessToken": accessToken,
    "telephoneNumber": telephoneNumber
  };
  supportRequestSession = new supportRequestSession(supportRequestSessionProperties);
  return supportRequestSession.save(function(err) {
    if (err != null) {
      console.log(supportRequestSession, err);
      return callback("failed creating user w/ err " + err);
    } else {
      return callback(null, supportRequestSession);
    }
  });
};

var SupportRequestSession = module.exports.supportRequestSession = mongoose.model('SupportRequestSession', supportRequestSessionSchema, 'supportRequestSessions');