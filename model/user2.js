var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = mongoose.Types.ObjectId
  , bcrypt = require('bcrypt')
  , uuid = require('node-uuid')
  , Q = require('q')
  , crypto = require('crypto')
  , userTypes = require('../secrets').userTypes;

var SALT_WORK_FACTOR = 10;
 
var oauthIdenSchema = new Schema({
  provider: String, 
  accessToken: String,
  accessTokenExtra: Schema.Types.Mixed,
  metadata: Schema.Types.Mixed
});

function newUserSchema(){
  return new Schema({
      id: { type: String, required: true, index: false },
      username: { type: String, required: true, lowercase: true, trim: true, index: false },
      password: { type: String, trim: true },
      recoverPasswordHash: { type: String, trim: true },
      recoverPasswordExpiry: { type: Date },

      email: { type: String, lowercase: true, trim: true },
      emailConfirmed: { type: Boolean, default: false },
      emailVerified: { type: Boolean, default: false },
      emailVerificationHash: { type: String },

      userApproved: { type: Boolean, default: false },
      userApprovalHash: { type: String },

      profile: {
        pic: String,
        fname: String,
        mname: String,
        lname: String,
        skills: String,
        headline: String,
        status: String
      },

      identities: [ oauthIdenSchema ],

      joined: { type: Date, default: Date.now },
      lastUpdated: { type: Date, default: Date.now }
    });
}

function attachMethods(userSchema){

    userSchema.virtual('usesPasswordAuth').get(function(){
        return !!(this.password && this.password.length > 0)
    });
     
    userSchema.methods.checkPassword = function(userPwd){
        var deferred = Q.defer();
        bcrypt.compare(userPwd, this.password, deferred.makeNodeResolver());
        return deferred.promise;
    }

    userSchema.statics.generatePasswordHash = function(password){
        var deferred = Q.defer();
        bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt){
            if(err){
                return deferred.reject(err);
            }
            bcrypt.hash(password, salt, function(err, hash){
                if(err){
                    return deferred.reject(err);
                }
                return deferred.resolve(hash);
            });
        });
        return deferred.promise;
    }

    userSchema.statics.register = function(userType, newUserAttrs){
        var deferred = Q.defer();

        var password = newUserAttrs.password;

        var UserModel = getUserModel(userType);
        var newUser = new UserModel();
        newUser.username = newUserAttrs.username;
        newUser.email = newUserAttrs.email;
        newUser.profile.skills = newUserAttrs.skills;

        // id = username for non-OAuth user (id = uniqueId on external network for OAuth user)
        newUser.id = newUser.username;

        // E-mail needs to be confirmed for OAuth users only
        newUser.emailConfirmed = true;

        newUser.emailVerified = false;
        newUser.emailVerificationHash = uuid.v1();
        
        newUser.userApproved = false;
        newUser.userApprovalHash = uuid.v4();

        this.generatePasswordHash(password)
            .then(function(passwordHash){
                newUser.password = passwordHash;
                newUser.recoverPasswordHash = uuid.v1();
                newUser.save(function (err){
                  if (err) return deferred.reject("Couldn't complete registration. Please try again later. " + err);
                  return deferred.resolve(newUser);
                });
            })
            .fail(function(err){
                return deferred.reject(err);
            })
            .done();

        return deferred.promise;
    }

    userSchema.statics.updatePassword = function(userType, lookup, newPassword){
        var deferred = Q.defer();
        
        this.generatePasswordHash(newPassword)
            .then(function(passwordHash){
                var updates = {};
                updates.password = passwordHash;
                updates.recoverPasswordHash = uuid.v1();
                updates.lastUpdated = new Date();

                this.update(lookup, { 
                        $set: updates
                }, function(err, rowsAffected){
                    if(err) return deferred.reject(err);
                    if(rowsAffected === 0) deferred.reject(new Error("USER_NOT_FOUND"));
                    deferred.resolve(updates);
                });
            })
            .fail(function(err){
                return deferred.reject(err);
            })
            .done();

        return deferred.promise;
    }

    userSchema.statics.updateEmail = function(userType, usesPasswordAuth, lookup, email){
        var deferred = Q.defer();
        
        var updates = {};
        updates.email = email;
        updates.emailConfirmed = true;
        updates.emailVerified = false;
        updates.emailVerificationHash = uuid.v1();
        updates.lastUpdated = new Date();

        this.update(lookup, { 
                $set: updates
        }, function(err, rowsAffected){
            if(err) return deferred.reject(err);
            if(rowsAffected === 0) deferred.reject(new Error("USER_NOT_FOUND"));
            deferred.resolve(updates);
        });

        return deferred.promise;
    }

    userSchema.statics.verifyEmail = function(userType, lookup){
        var deferred = Q.defer();

        var updates = {};
        updates.emailVerified = true;
        updates.lastUpdated = new Date();

        this.update(lookup, { $set: updates }, function(err, rowsAffected){
            if(err) return deferred.reject(err);
            if(rowsAffected === 0) deferred.reject(new Error("USER_NOT_FOUND"));
            deferred.resolve(updates);
        });

        return deferred.promise;
    }

    userSchema.statics.approveAccount = function(userType, lookup){
        var deferred = Q.defer();

        var updates = {};
        updates.userApproved = true;
        updates.lastUpdated = new Date();

        this.update(lookup, { $set: updates }, function(err, rowsAffected){
            if(err) return deferred.reject(err);
            if(rowsAffected === 0) deferred.reject(new Error("USER_NOT_FOUND"));
            deferred.resolve(updates);
        });

        return deferred.promise;
    }

    userSchema.statics.getUser = function(userType, lookup, fields){

        var deferred = Q.defer();
        var selectFields = fields || "";
        var lookupQuery = {};

        if('string' === typeof lookup){
            lookupQuery.username = lookup;
        } else if('object' === typeof lookup){
            lookupQuery = lookup;
        } else {
            return deferred.reject("Unable to fetch user for the given query: " + lookup);
        }

        if(!!userType) {
            // Fetch user of a specific type
            lookupQuery.userType = userType;
        }
        
        this.findOne(lookupQuery).select(selectFields).exec(function(err, user){
            if(err) return deferred.reject(err);
            if(user) return deferred.resolve(user);

            var userNotFoundErr = new Error("USER_NOT_FOUND"); // Move to constant
            userNotFoundErr.friendlyMessage = "Invalid username or password.";
            userNotFoundErr.request = lookupQuery;
            return deferred.reject(userNotFoundErr);
        });

        return deferred.promise;
    }


    userSchema.statics.getAuthenticated = function(userType, username, password){
        var deferred = Q.defer();

        this.getUser(userType, { 'username': username })
            .then(function(user){
                return user.checkPassword(password)
                    .then(function(isMatch) {
                        if(!isMatch){
                           throw new Error("Invalid username or password.");
                        }
                        return deferred.resolve(user);
                    })
                    .fail(function(err) {
                        return deferred.reject(err);
                    })
                    .done();
            })
            .fail(function(err){
                if(err && err.message && err.message === 'USER_NOT_FOUND'){
                    return deferred.reject(err.friendlyMessage); // reject
                }
                return deferred.reject(err); // friendlier message, perhaps? 
            })
            .done();
        return deferred.promise;
    }

    return userSchema;
}


function buildUserSchema(userType){
  var userSchema = newUserSchema();
  userSchema.add({
    userType: { type: String, default: userType }  
  });
  return attachMethods(userSchema);
}


var models = {};

module.exports = function(userType){
    if(userTypes.indexOf(userType) < 0){
        throw new Error("Unsupported UserModel");
    }

    var UserSchema = buildUserSchema(userType);
    UserSchema.index({ 'username': 1, 'userType': 1 }, { unique: false });

    return models[userType] = mongoose.model(userType, UserSchema, 'users');
}

function getUserModel(userType){
    if(!models[userType]){
        throw new Error("Invalid UserType: " + userType);
    }
    return models[userType];
}