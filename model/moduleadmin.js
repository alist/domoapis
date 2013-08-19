var mongoose = require('mongoose')
  , Schema = mongoose.Schema
 // , ObjectId = mongoose.Types.ObjectId
 // , bcrypt = require('bcrypt')
 // , uuid = require('node-uuid')
  //, crypto = require('crypto')
  , errors = require('./errors').errors;
  // , Organizations = require('./organization').Organization

var moduleadminSchema = new Schema({
  /*profile: {
    imageURI: String,
    fname: String,
    mname: String,
    lname: String,
    skills: String,
    headline: String,
    displayName: String,    
    status: String
  },*/
  
  moduleAreas: [ { identifier: String, name: String } ],
  
  joinedInRoleDate: { type: Date, default: Date.now },
  modifiedDate: { type: Date, index: { unique: false } },
  modifiedBy: { $id : Schema.ObjectId , $db : "admin" },

  preferredCommMethod: { type: String, default: 'email', enum: ['email', 'text message'] },

});


moduleadminSchema.statics.register = function(newModuleadminAttrs, callback){

  //var self = this;
  this.findModuleadminAll({ id: newModuleadminAttrs.email }, '_id email', function(err, moduleadmin){

    if(!!moduleadmin){
      return callback(errors['SUPPORTER_EXISTS']());
    }

    if(err instanceof Error && (!err.id || err.id !== 'SUPPORTER_NOT_FOUND')){
      return callback(err);
    }

    var newModuleadmin = new Moduleadmin();

        newModuleadmin.save(function (err){
          if(err){
              return callback(errors['DB_FAIL'](err));
          }
          return callback(null, newModuleadmin);
        });
    });
}


moduleadminSchema.statics.findModuleadminAll = function(lookupQuery, selectFields, callback){
  this.findOne(lookupQuery).select(selectFields).exec(function(err, moduleadmin){
    if(err) return callback(err);
    if(moduleadmin) return callback(null, moduleadmin);

    return callback(errors['SUPPORTER_NOT_FOUND'](lookupQuery));
  });
}

moduleadminSchema.statics.getModuleadmin = function(lookup, fields, callback){

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
      return callback(errors['INVALID_ARG']("Unable to fetch moduleadmin for the given query: " + lookup));
  }

  // if(!lookupQuery.userType) {
  //     // Fetch user of a specific type
  //     lookupQuery.userType = this.userType;
  // }
  // console.log('lookupQuery', lookupQuery)
  return this.findModuleadminAll(lookupQuery, selectFields, callback);
}

exports.allModuleadmins = function(callback) {
  var _this = this;
  return Moduleadmin.find({}, {}, function(err, moduleadmins) {
    return callback(err, moduleadmins);
  });
};

exports.getModuleadminWithID = function(ID, callback) {
  var _this = this;
  return Moduleadmin.findOne({
    _id: ID
  }, {
    fbAccessToken: 0,
    facebookID: 0
  }, function(err, moduleadmin) {
    var moduleadminInfo;
    if ((err != null) || (moduleadmin != null) === false) {
      return callback("could not find moduleadmin of id " + ID + " with error " + err);
    } else {
      moduleadminInfo = {
        profile: moduleadmin.profile
      };
      return callback(null, moduleadmin, moduleadminInfo);
    }
  });
};

exports.newModuleadmin = function(profile, moduleAreas, callback) {
  var moduleadmin, moduleadminProperties,
    _this = this;
  moduleadminProperties = {
    "profile": profile,
    "joined": new Date
  };
  moduleadmin = new Moduleadmin(moduleadminProperties);
  return moduleadmin.save(function(err) {
    if (err != null) {
      console.log(moduleadmin, err);
      return callback("failed creating moduleadmin w/ err " + err);
    } else {
      return callback(null, moduleadmin);
    }
  });
};

exports.updateModuleadminWithID = function(ID, profile, moduleAreas, callback) {
  return exports.getSuppporteeWithID(ID, function(err, moduleadmin, info) {
    if (profile !== null) {
      moduleadmin.profile = profile;
    }
    if (moduleAreas !== null) {
      moduleadmin.moduleAreas = moduleAreas;
    }
    return moduleadmin.save(function(err) {
      callback(err, moduleadmin);
    });
  });
};

var Moduleadmin = module.exports.Moduleadmin = mongoose.model('Moduleadmin', moduleadminSchema, 'moduleadmins');