var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = mongoose.Types.ObjectId
  , bcrypt = require('bcrypt')
  , uuid = require('node-uuid')
  , crypto = require('crypto')
  , errors = require('./errors').errors
  // , supportee = require('./supportee').supportee
  // , Organizations = require('./organization').Organization


exports.userLoginURLBase = "https://oh.domo.io/urllogin?token=";


var SALT_WORK_FACTOR = 10;

var userSchema = new Schema({
  userID: {type: String, required: true, index: { unique: true } },
  email: { type: String, lowercase: true, trim: true, index: { unique: true } },
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

  userApproved: { type: Boolean, default: false },
  userApprovalHash: { type: String },

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
  modifiedBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
  displayName: String, 
  
  token: { type: String },

  roles: [String], // supporter, supportee, admin, pointperson,reporter,omnipotent
  organization: { type: Schema.Types.ObjectId, ref: 'organizations' },
  //supportAreas: [ { identifier: String, name: String } ],

  //need to: unify the coms system 

  // cleanup, cleanup everybody everywhere
  //isAdmin: {type: Boolean},
  permissions: [{type: String}],
  //imageURI: String,
  activeSessionIDs: [ {type: String, index: {unique: true}} ],
});


userSchema.virtual('usesPasswordAuth').get(function(){
  return !!(this.password && this.password.length > 0)
});
 
userSchema.methods.checkPassword = function(userPwd, callback){
  bcrypt.compare(userPwd, this.password, callback);
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
  this.findUserAll({ id: newUserAttrs.email }, '_id email', function(err, user){

    if(!!user){
      return callback(errors['USERNAME_EXISTS']());
    }

    if(err instanceof Error && (!err.id || err.id !== 'USER_NOT_FOUND')){
      return callback(err);
    }

    var newUser = new User();
    newUser.userID = newUser.email = newUserAttrs.email;

    newUserAttrs.roles.forEach(function(role){
      newUser.roles.push(role);
    });
    
    newUser.emailConfirmed = true;
    newUser.emailVerified = false;
    newUser.emailVerificationHash = uuid.v1();
    
    newUser.userApproved = false;
    newUser.userApprovalHash = uuid.v4();

    self.generatePasswordHash(newUserAttrs.password, function(err, passwordHash){
        if(err){
            return callback(err);
        }
        newUser.password = passwordHash;
        newUser.recoverPasswordHash = uuid.v1();
        newUser.save(function (err){
          if(err){
              return callback(errors['DB_FAIL'](err));
          }
          return callback(null, newUser);
        });
    });
    
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


userSchema.statics.approveAccount = function(lookup, callback){
  var updates = {};
  updates.userApproved = true;
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

  // if(!lookupQuery.userType) {
  //     // Fetch user of a specific type
  //     lookupQuery.userType = this.userType;
  // }
  // console.log('lookupQuery', lookupQuery)
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


var genCode = function(length, salt) {
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

exports.getUserWithToken = function(token, callback) {
  if (!token) {
    callback("no token provided for this user");
    return;
  }
  return User.findOne({
    token: token
  }, {}, function(err, user) {
    if (!err || !user) {
      return callback("no user found for token: " + token);
    } else {
      return callback(null, user);
    }
  });
};

// exports.authCurrentUserWithIDAndTokenForSession = function(userID, fbAToken, sessionToken, callback) {
//   var _this = this;
//   if (!sessionToken) {
//     callback("no sessionToken included for userID user lookup");
//     return;
//   }
//   return User.findOne({
//     activeSessionIDs: sessionToken
//   }, {}, function(err, user) {
//     if ((err != null) || (user != null) === false) {
//       if ((userID != null) === false && (fbAToken != null) === false) {
//         callback("invalid session- and no re-auth route possible");
//         return;
//       }
//       return authUserWithFacebookOfIDAndToken(userID, fbAToken, function(err, fbUserID, fbResponse) {
//         var imgURI, userInfo, _ref;
//         if ((err != null) || ((fbUserID !== userID) && (userID != null) === true)) {
//           return callback("could not find user with pre-id " + userID + " with fbID " + fbUserID + " with error " + err);
//         } else {
//           if ((userID != null) === false) {
//             console.log("using recursion to determine if fbUserID exists, now that we know it's " + fbUserID);
//             return authCurrentUserWithIDAndTokenForSession(fbUserID, fbAToken, sessionToken, callback);
//           } else {
//             imgURI = "https://graph.facebook.com/" + fbUserID + "/picture?type=large&return_ssl_resources=1";
//             userInfo = {
//               userID: fbUserID,
//               facebookID: fbUserID,
//               fbAccessToken: fbAToken,
//               imageURI: imgURI,
//               userDisplayName: fbResponse.name,
//               modifiedDate: new Date()
//             };
//             userInfo.metroAreaDisplayName = (_ref = fbResponse.location) != null ? _ref.name : void 0;
//             console.log("create the user! with info " + userInfo);
//             return User.update({
//               userID: fbUserID
//             }, {
//               $set: userInfo,
//               $push: {
//                 activeSessionIDs: sessionToken
//               }
//             }, {
//               upsert: 1
//             }, function(err) {
//               if (err != null) {
//                 return callback("error for user save " + err + " with info " + userInfo);
//               } else {
//                 console.log("saved new user with info " + userInfo + ", using recursion for auth");
//                 return authCurrentUserWithIDAndTokenForSession(fbUserID, fbAToken, sessionToken, callback);
//               }
//             });
//           }
//         }
//       });
//     } else {
//       return callback(null, user);
//     }
//   });
// };

// exports.authUserWithFacebookOfIDAndToken = function(fbID, fbToken, callback) {
//   var requestURL;
//   if ((fbToken != null) === false) {
//     callback("missing token for fb req");
//     return;
//   }
//   requestURL = "https://graph.facebook.com/me?access_token=" + fbToken;
//   return request(requestURL, function(error, response, body) {
//     var resObjects;
//     if ((error != null) || response.statusCode !== 200) {
//       callback("fbreq err " + error + " with code " + response.statusCode);
//       return;
//     }
//     resObjects = JSON.parse(body);
//     if ((resObjects != null ? resObjects.id : void 0) !== fbID) {
//       console.log("fbreq mismatched fbID from req " + fbID + " from server " + (resObjects != null ? resObjects.id : void 0));
//     }
//     if (((resObjects != null ? resObjects.id : void 0) != null) === false) {
//       return callback("no fbID returned for token " + fbToken);
//     } else {
//       return callback(null, resObjects.id, resObjects);
//     }
//   });
// };

exports.getUserWithID = function(userID, callback) {
  var _this = this;
  return User.findOne({
    userID: userID
  }, {
    fbAccessToken: 0,
    facebookID: 0
  }, function(err, user) {
    var userInfo;
    if (!err || !user) {
      return callback("could not find user of id " + userID + " with error " + err);
    } else {
      userInfo = {
        imageURI: user.imageURI,
        userID: user.userID.toString(),
        metroAreaDisplayName: user.metroAreaDisplayName,
        userDisplayName: user.userDisplayName,
        ratingCount: user.ratingCount
      };
      return callback(null, user, userInfo);
    }
  });
};

exports.allUsersWithPermission = function(permission, callback) {
  var _this = this;
  return User.find({
    permissions: permission
  }, {}, function(err, users) {
    return callback(err, users);
  });
};

exports.allUsers = function(callback) {
  var _this = this;
  return User.find({}, {}, function(err, users) {
    return callback(err, users);
  });
};

exports.newUser = function(displayName, permissions, telephoneNumber, callback) {
  var user, userProperties,
    _this = this;
  userProperties = {
    "displayName": displayName,
    "modifiedDate": new Date,
    "notificationInterval": 21600000,
    "overIntervalMessageAllowanceCount": 40,
    "permissions": permissions,
    "telephoneNumber": telephoneNumber,
    "token": genCode(20, displayName),
    "userID": genCode(10, displayName)
  };
  user = new User(userProperties);
  return user.save(function(err) {
    if (err != null) {
      console.log(user, err);
      return callback("failed creating user w/ err " + err);
    } else {
      return callback(null, user);
    }
  });
};

exports.updateUserWithID = function(userID, displayName, permissions, phoneNumber, callback) {
  var _this = this;
  return exports.getUserWithID(userID, function(err, user, info) {
    var numberChanged;
    if (displayName != null) {
      user.displayName = displayName;
    }
    if (permissions != null) {
      user.permissions = permissions;
    }
    numberChanged = false;
    if (phoneNumber != null) {
      if (user.telephoneNumber !== phoneNumber) {
        user.telephoneNumber = phoneNumber;
        numberChanged = true;
      }
    }
    return user.save(function(err) {
      var message;
      callback(err, user);
      // if (numberChanged) {
      //   message = "you're activated! Login with https://oh.domo.io/urllogin/" + user.token;
      //   return comsModel.processMessageToRecipientForSMS(message, user.telephoneNumber, comsModel.sendSMS, function(err, recp) {
      //     return console.log("sent sms to activator userID: " + userID + " w/ err " + err);
      //   });
      // }
    });
  });
};

var User = module.exports.User = mongoose.model('User', userSchema, 'users');