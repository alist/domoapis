var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = mongoose.Types.ObjectId
  , bcrypt = require('bcrypt')
  , uuid = require('node-uuid')
  , crypto = require('crypto')
  , errors = require('./errors').errors
  , async = require('async')
  , _ = require('lodash')
  , TokenOptions = require('./tokenOptions')


var OrganizationModel = require('./organization')
  , Organization = OrganizationModel.Organization
  , OrgUserModel = require('./orguser')
  , OrgUser = OrgUserModel.OrgUser

var SALT_WORK_FACTOR = 10;


module.exports.userLoginURLBase = "https://oh.domo.io/urllogin?token=";

module.exports.publicAtrrs = [
  '_id',
  'userID',
  'email',
  'joined',
  'profile',
  'organizations',
  'displayName'
];


var userSchema = new Schema({
  userID: {type: String, required: true, index: { unique: true } },
  email: { type: String, index: { unique: true } },
  emailConfirmed: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  emailVerificationHash: { type: String },

  telephoneNumber: {type: String, index: {unique: false}},
  telephoneVerifyDate: {type: Date},
  telephoneNumberVerifyAttemptCount: {type: Number},
  telelphoneVerifyCode: {type: String},

  password: { type: String, trim: true },
  recoverPasswordHash: { type: String, trim: true },
  recoverPasswordExpiry: { type: Date },


  profile: {
    imageURI: String,
    fname: String,
    mname: String,
    lname: String,
    skills: String,
    headline: String,
    status: String
  },

  joined: { type: Date, default: Date.now },
  modifiedDate: { type: Date, index: { unique: false } },

  displayName: String,

  activeSessionIDs: [ {type: String, index: {unique: true}} ],


  organizations: [
    { type: Schema.Types.ObjectId, ref: 'organization' }
  ],

  modifiedBy: [
    {
      id:     Schema.Types.ObjectId,
      role:   String,
      date:   Date
    }
  ]
});


var transformToken = function(token) {
  return this._id + '|' + token;
}

TokenOptions.addToSchema(userSchema, { schemaKey: 'userID', transformToken: transformToken });


userSchema.virtual('usesPasswordAuth').get(function(){
  return !!(this.password && this.password.length > 0)
});

userSchema.methods.checkPassword = function(userPwd, callback){
  bcrypt.compare(userPwd, this.password, callback);
}

userSchema.methods.getUserOrg = function(orgId) {
  return _.first(this.organizations, function(oId) {
    return (oId.toString() === orgId.toString());
  });
}

userSchema.methods.getMailRecipient = function() {
  var fullName = this.profile && ((this.profile.fname || '') + " " + (this.profile.lname || ''));
  var sendTo = '';
  if('string' === typeof fullName && fullName.trim().length){
    sendTo = (fullName.trim().length ? "'" + fullName.trim() + "'" : "")  + " <" + this.email + ">";
  } else {
    sendTo = this.email;
  }
  return sendTo;
}


userSchema.methods.asJSON = function() {
  return _.pick(this.toObject(), module.exports.publicAtrrs);
}


userSchema.statics.generatePasswordHash = function(password, callback){
  bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt){
      if(err){
          return callback(err);
      }
      bcrypt.hash(password, salt, callback);
  });
}

userSchema.statics.register = function(newUserAttrs, callback){

  var self = this;
  var newUser, org;

  async.waterfall([

    // lookup user
    function(next) {

      self.findUserAll({ email: newUserAttrs.email }, '_id email', function(err, user){
        if(!!user){
          return next(errors['USERNAME_EXISTS']());
        }
        if(err instanceof Error && (err.id !== 'USER_NOT_FOUND')){
          return next(err);
        }

        next();
      });
    },

    // verify org membership
    function(next) {

      // validations belong in the controller, not here
      // if(!newUserAttrs.orgId) {
      //   return callback(errors['ORG_NOT_FOUND']('orgId not specified'));
      // }

      Organization.getById(newUserAttrs.orgId, function(err, o) {
        if(err) {
          return next(err);
        }
        if(!o) {
          return next(errors['ORG_NOT_FOUND']());
        }

        org = o;
        return next();
      });

    },

    // create new user
    function(next) {

      newUser = new User();
      newUser.userID = newUser.email = newUserAttrs.email;
      newUser.organizations.push(org._id);

      newUser.emailConfirmed = true;
      newUser.emailVerified = false;
      newUser.emailVerificationHash = uuid.v1();

      self.generatePasswordHash(newUserAttrs.password, function(err, passwordHash) {
        if(err){
          return next(err);
        }
        return next(null, passwordHash);
      });
    },

    // save user
    function(passwordHash, next) {
      newUser.password = passwordHash;
      newUser.recoverPasswordHash = uuid.v1();

      newUser.save(function(err){
        if(err){
            return next(errors['DB_FAIL'](err));
        }
        return next(null, newUser);
      });
    },

    // create orguser and roles
    function(newUser, next) {

      OrgUser.new({
        userId: newUser._id,
        orgId: org._id,
        email: newUser.email,
        roles: newUserAttrs.roles
      }, next);
    }

  ], function(err, orguser) {
    return callback(err, newUser, orguser, org);
  });

}


userSchema.statics.findUserAll = function(lookupQuery, selectFields, callback){
  this.findOne(lookupQuery).select(selectFields).exec(function(err, user){
    if(err) return callback(err);
    if(user) return callback(null, user);

    return callback(errors['USER_NOT_FOUND'](lookupQuery));
  });
}


userSchema.statics.updatePassword = function(lookup, newPassword, callback){

  var self = this;

  this.generatePasswordHash(newPassword, function(err, passwordHash){
    var updates = {};
    updates.password = passwordHash;
    updates.recoverPasswordHash = uuid.v1();
    updates.lastUpdated = new Date();

    self.update(lookup, {
        $set: updates
    }, function(err, rowsAffected){
        if(err) return callback(err);
        if(rowsAffected === 0) callback(errors['USER_NOT_FOUND']());
        callback(null, updates);
    });
  });
}

userSchema.statics.updateEmail = function(usesPasswordAuth, lookup, email, callback){
  var updates = {};
  updates.email = email;
  updates.emailConfirmed = true;
  updates.emailVerified = false;
  updates.emailVerificationHash = uuid.v1();
  updates.lastUpdated = new Date();

  this.update(lookup, {
      $set: updates
  }, function(err, rowsAffected){
      if(err) return callback(err);
      if(rowsAffected === 0) callback(errors['USER_NOT_FOUND']());
      callback(null, updates);
  });
}


userSchema.statics.verifyEmail = function(lookup, callback){
  var updates = {};
  updates.emailVerified = true;
  updates.lastUpdated = new Date();

  this.update(lookup, { $set: updates }, function(err, rowsAffected){
      if(err) return callback(err);
      if(rowsAffected === 0) callback(errors['USER_NOT_FOUND']());
      callback(null, updates);
  });
}


userSchema.statics.getUser = function(lookup, fields, callback){

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
      return callback(errors['INVALID_ARG']("Unable to fetch user for the given query: " + lookup));
  }

  return this.findUserAll(lookupQuery, selectFields, callback);
}


userSchema.statics.getAuthenticated = function(email, password, callback){
  this.getUser({ 'userID': email },
    function(err, user){
      if(err && err.message && err.id === 'USER_NOT_FOUND'){
        return callback(err); // reject
      }

      user.checkPassword(password, function(err, result){
        if(err || result !== true){
          return callback(errors['INVALID_USERNAME_PASSWORD']('Password mismatch'));
        }
        return callback(null, user);
      });
    });
}



var User = module.exports.User = mongoose.model('user', userSchema, 'user');