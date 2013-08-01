var mongoose = require('mongoose')
  , Schema = mongoose.Schema
 // , ObjectId = mongoose.Types.ObjectId
 // , bcrypt = require('bcrypt')
 // , uuid = require('node-uuid')
  //, crypto = require('crypto')
  , errors = require('./errors').errors;
  // , Organizations = require('./organization').Organization

var supporteeSchema = new Schema({
  /*profile: {
    imageURI: String,
    fname: String,
    mname: String,
    lname: String,
    headline: String,
    displayName: String,    
    status: String
  }, */
  
  joinedInRoleDate: { type: Date, default: Date.now },
  modifiedDate: { type: Date, index: { unique: false } },
  modifiedBy: { $id : Schema.ObjectId , $db : "admin" },

  messageCount: {type: Number}, //how many msgs they've received
  overIntervalMessageAllowanceCount: {type: Number}, //how many msgs allowed to be sent past the notification interval
  lastNotificationDate: {type: Date, index: {unique: false}},
  notificationInterval: {type: Number}

});


supporteeSchema.statics.register = function(newSupporteeAttrs, callback){

  //var self = this;
  this.findSupporteeAll({ id: newSupporteeAttrs.email }, '_id email', function(err, supportee){

    if(!!supportee){
      return callback(errors['SUPPORTEE_EXISTS']());
    }

    if(err instanceof Error && (!err.id || err.id !== 'SUPPORTEE_NOT_FOUND')){
      return callback(err);
    }

    var newSupportee = new Supportee();

        newSupportee.save(function (err){
          if(err){
              return callback(errors['DB_FAIL'](err));
          }
          return callback(null, newSupportee);
        });
    });
}


supporteeSchema.statics.findSupporteeAll = function(lookupQuery, selectFields, callback){
  this.findOne(lookupQuery).select(selectFields).exec(function(err, supportee){
    if(err) return callback(err);
    if(supportee) return callback(null, supportee);

    return callback(errors['SUPPORTEE_NOT_FOUND'](lookupQuery));
  });
}

supporteeSchema.statics.getSupportee = function(lookup, fields, callback){

  if(typeof fields === 'function'){
      // fn(lookup, callback)
      callback = fields;
      fields = null;
  }

  var selectFields = fields || "";
  var lookupQuery = {};

  if('string' === typeof lookup){
      lookupQuery.userID = lookup;
  } else if('object' === typeof lookup){
      lookupQuery = lookup;
  } else {
      return callback(errors['INVALID_ARG']("Unable to fetch supportee for the given query: " + lookup));
  }

  // if(!lookupQuery.userType) {
  //     // Fetch user of a specific type
  //     lookupQuery.userType = this.userType;
  // }
  // console.log('lookupQuery', lookupQuery)
  return this.findSupporteeAll(lookupQuery, selectFields, callback);
}

exports.allSupportees = function(callback) {
  var _this = this;
  return Supportee.find({}, {}, function(err, supportees) {
    return callback(err, supportees);
  });
};

exports.getSupporteeWithID = function(ID, callback) {
  var _this = this;
  return Supportee.findOne({
    _id: ID
  }, {
    fbAccessToken: 0,
    facebookID: 0
  }, function(err, supportee) {
    var supporteeInfo;
    if ((err != null) || (supportee != null) === false) {
      return callback("could not find supportee of id " + ID + " with error " + err);
    } else {
      supporteeInfo = {
        profile: supportee.profile
      };
      return callback(null, supportee, supporteeInfo);
    }
  });
};

exports.newSupportee = function(profile, callback) {
  var supportee, supporteeProperties,
    _this = this;
  supporteeProperties = {
    "profile": profile,
    "joined": new Date
  };
  supportee = new Supportee(supporteeProperties);
  return supportee.save(function(err) {
    if (err != null) {
      console.log(supportee, err);
      return callback("failed creating supportee w/ err " + err);
    } else {
      return callback(null, supportee);
    }
  });
};

exports.updateSupporteeWithID = function(ID, profile, callback) {
  return exports.getSuppporteeWithID(ID, function(err, supportee, info) {
    supportee.profile = profile;
    supportee.modifiedDate = new Date
    return supportee.save(function(err) {
      callback(err, supportee);
    });
  });
};

var Supportee = module.exports.Supportee = mongoose.model('Supportee', supporteeSchema, 'supportees');