var mongoose = require('mongoose')
  , Schema = mongoose.Schema
 // , ObjectId = mongoose.Types.ObjectId
 // , bcrypt = require('bcrypt')
 // , uuid = require('node-uuid')
  //, crypto = require('crypto')
  , errors = require('./errors').errors;
  // , Organizations = require('./organization').Organization

var supporterSchema = new Schema({
  /*profile: {
    imageURI: String,
    fname: String,
    mname: String,
    lname: String,
    skills: String,
    headline: String,
    displayName: String,    
    status: String
  }, */
  
  supportAreas: [ { identifier: String, name: String } ],
  
  joinedInRoleDate: { type: Date, default: Date.now },
  modifiedDate: { type: Date, index: { unique: false } },
  modifiedBy: { $id : Schema.ObjectId , $db : "admin" },

  messageCount: {type: Number}, //how many msgs they've received
  overIntervalMessageAllowanceCount: {type: Number}, //how many msgs allowed to be sent past the notification interval
  lastNotificationDate: {type: Date, index: {unique: false}},
  notificationInterval: {type: Number}


});


supporterSchema.statics.register = function(newSupporterAttrs, callback){

  //var self = this;
  this.findSupporterAll({ id: newSupporterAttrs.email }, '_id email', function(err, supporter){

    if(!!supporter){
      return callback(errors['SUPPORTER_EXISTS']());
    }

    if(err instanceof Error && (!err.id || err.id !== 'SUPPORTER_NOT_FOUND')){
      return callback(err);
    }

    var newSupporter = new Supporter();

        newSupporter.save(function (err){
          if(err){
              return callback(errors['DB_FAIL'](err));
          }
          return callback(null, newSupporter);
        });
    });
}


supporterSchema.statics.findSupporterAll = function(lookupQuery, selectFields, callback){
  this.findOne(lookupQuery).select(selectFields).exec(function(err, supporter){
    if(err) return callback(err);
    if(supporter) return callback(null, supporter);

    return callback(errors['SUPPORTER_NOT_FOUND'](lookupQuery));
  });
}

supporterSchema.statics.getSupporter = function(lookup, fields, callback){

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
      return callback(errors['INVALID_ARG']("Unable to fetch supporter for the given query: " + lookup));
  }

  // if(!lookupQuery.userType) {
  //     // Fetch user of a specific type
  //     lookupQuery.userType = this.userType;
  // }
  // console.log('lookupQuery', lookupQuery)
  return this.findSupporterAll(lookupQuery, selectFields, callback);
}

exports.allSupporters = function(callback) {
  var _this = this;
  return Supporter.find({}, {}, function(err, supporters) {
    return callback(err, supporters);
  });
};

exports.getSupporterWithID = function(ID, callback) {
  var _this = this;
  return Supporter.findOne({
    _id: ID
  }, {
    fbAccessToken: 0,
    facebookID: 0
  }, function(err, supporter) {
    var supporterInfo;
    if ((err != null) || (supporter != null) === false) {
      return callback("could not find supporter of id " + ID + " with error " + err);
    } else {
      supporterInfo = {
        profile: supporter.profile
      };
      return callback(null, supporter, supporterInfo);
    }
  });
};

exports.newSupporter = function(profile, supportAreas, callback) {
  var supporter, supporterProperties,
    _this = this;
  supporterProperties = {
    "profile": profile,
    "joined": new Date
  };
  supporter = new Supporter(supporterProperties);
  return supporter.save(function(err) {
    if (err != null) {
      console.log(supporter, err);
      return callback("failed creating supporter w/ err " + err);
    } else {
      return callback(null, supporter);
    }
  });
};

exports.updateSupporterWithID = function(ID, profile, supportAreas, callback) {
  return exports.getSuppporteeWithID(ID, function(err, supporter, info) {
    if (profile !== null) {
      supporter.profile = profile;
    }
    if (supportAreas !== null) {
      supporter.supportAreas = supportAreas;
    }
    return supporter.save(function(err) {
      callback(err, supporter);
    });
  });
};

var Supporter = module.exports.Supporter = mongoose.model('Supporter', supporterSchema, 'supporters');