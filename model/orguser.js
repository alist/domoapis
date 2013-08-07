var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = mongoose.Types.ObjectId
  , async = require('async')
  , _ = require('lodash')


// Import all schemas so they get registered with mongoose
var SupporteeModel = require('./user_supportee')
  , SupporterModel = require('./user_supporter')
  , ModuleAdminModel = require('./user_moduleadmin')
  , AdminModel = require('./user_admin')
  , AdopterModel = require('./user_adopter')


var validRoles = module.exports.validRoles = [ 'supportee', 'supporter', 'moduleadmin', 'admin', 'adopter' ];

var orgUserSchema = new Schema({
  userId:    { type: Schema.Types.ObjectId, ref: 'user', required: true },
  orgId:     { type: Schema.Types.ObjectId, ref: 'organization', required: true },
  joined:    { type: Date, default: Date.now },
  roles: {
    supportee:    { type: Schema.Types.ObjectId, ref: 'supportee' },
    supporter:    { type: Schema.Types.ObjectId, ref: 'supporter' }, 
    moduleadmin:  { type: Schema.Types.ObjectId, ref: 'moduleadmin' },
    admin:        { type: Schema.Types.ObjectId, ref: 'admin' },
    adopter:      { type: Schema.Types.ObjectId, ref: 'adopter' }
  }
});



orgUserSchema.statics.new = function(newAttrs, callback){
  var orguser = new OrgUser();
  orguser.orgId = newAttrs.orgId;
  orguser.userId = newAttrs.userId;

  async.waterfall([

    function(next) {
      if(_.isObject(newAttrs.roles) && !_.isArray(newAttrs.roles)) {
        return addRolesToUser(orguser, newAttrs.roles, next);
      }
      return next(null, orguser);
    },

    function(orguser, next) {
      orguser.save(function(err){
        if(err){
          return next(err);
        }
        return next(null, orguser);
      });
    }

  ], function(err, orguser){
    return callback(err, orguser);
  });

}



orgUserSchema.methods.hasRolesInOrg = function(roles){

  if(_.isString(roles)) {
    var t = roles;
    roles = [ t ];
  }

  if(!_.isArray(roles)) {
    throw new Error('Illegal argument (roles): required array or string');
  }

  var diff = _.difference(roles, _.keys(this.roles.toObject()));
  return (diff.length == 0);
}


orgUserSchema.methods.addRoles = function(roles, callback) {

  if(_.isArray(roles) || !_.isObject(roles)) {
    return callback(errors['INVALID_ARG']('roles should be an object'));
  }

  var newRoles = _.keys(roles);
  var diffValid = _.difference(newRoles, validRoles);
  if(!!diffValid.length) {
    return callback(errors['INVALID_ROLE'](diffValid));
  }

  var commRoles = _.intersection(_.keys(this.roles.toObject()), newRoles);
  if(!!commRoles.length) {
    return callback(errors['ROLE_EXISTS'](commRoles));
  }

  return addRolesToUser(this, roles, function(err, orguser) {
    if(err) {
      return callback(err);
    }

    orguser.save(function(err){
      if(err) {
        return callback(err);
      }
      return callback(null, orguser);
    })
  });
}


orgUserSchema.methods.removeRoles = function(roles, callback) {

  if(_.isString(roles)) {
    var t = roles;
    roles = [ t ];
  }

  if(roles.length === 0) {
    return callback(errors['INVALID_ARG']('roles not specified'));
  }

  var diffValid = _.difference(roles, validRoles);
  if(!!diffValid.length) {
    return callback(errors['INVALID_ROLE'](diffValid));
  }

  var commRoles = _.intersection(_.keys(this.roles.toObject()), roles);
  if(!commRoles.length) {
    return callback(errors['ROLE_NOT_FOUND'](commRoles));
  }

  var delDocsTasks = [];

  var unsetFields = {};
  var unsetPrefix = 'roles.';

  // Remove all "foreign" docs
  _.each(this.roles, function(roleDocId, role) {
    if(!_.contains(roles, role)) {
      return;
    }

    delDocsTasks.push(

        function(next) {
          // Find the "foreign" doc and remove it
          getUserRoleModel(role).findOneAndRemove({ _id: roleDocId }, function (err) {
            if(err) {
              return next(err);
            }
            
            unsetFields[unsetPrefix + role] = 1;
            return next();
          });
        }

    );

  });


  var self = this;

  return async.parallel(delDocsTasks, function(err, results){
    if(err) {
      return callback(err);
    }
    
    OrgUser.findOneAndUpdate({
      _id: self._id
    }, {
      $unset: unsetFields
    }, function(err, doc){
      return callback(err, doc);
    });

  });

}



var OrgUser = module.exports.OrgUser = mongoose.model('orguser', orgUserSchema, 'orguser');

function getUserRoleModel(role) {
  var model = mongoose.model(role);
  if(!model) {
    throw new Error('Model not found: ' + role);
  }
  return model;
}


function removeDocs(docs, callback){
  if(!_.isArray(docs)) {
    return callback(new Error('Illegal argument (docs): Expected array'));
  }

  var failed = {};

  async.each(docs,

    function(doc, next){
      doc.remove(function(e, d) {
        if(e) {
          // continue removing others
          failed.push({
            doc: doc,
            err: e
          });
        }
        return next();
      });
    },

    function(e) {
      if(!_.isEmpty(failed)) {
        return callback(e, failed);
      }
      return callback(e);
    });
}


function addRolesToUser(orguser, userRoleAttrs, callback) {
  var roles = _.keys(userRoleAttrs);

  async.each(roles,
    function(role, next){
      getUserRoleModel(role).new(userRoleAttrs[role], function(err, subUser){
        if(err){
          return next(err);
        }
        orguser.roles[role] = subUser._id;
        return next();
      });
    },
    function(err) {
      if(!err) {
        return callback(null, orguser);
      }

      // remove orphans, if any
      var subDocs = _.toArray(newRoles);
      if(!_.isEmpty(subDocs)) {
        return removeDocs(subDocs, callback);
      }
      
      return callback(err);
    });
}
