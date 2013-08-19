var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = mongoose.Types.ObjectId
  , uuid = require('node-uuid')
  , async = require('async')
  , _ = require('lodash')
  , errors = require('./errors').errors
  , Config = require('../configLoader')


// Import all schemas so they get registered with mongoose
var SupporteeModel = require('./user_supportee')
  , SupporterModel = require('./user_supporter')
  , ModuleAdminModel = require('./user_moduleadmin')
  , AdminModel = require('./user_admin')
  , AdopterModel = require('./user_adopter')


var validRoles = module.exports.validRoles = [ 'supportee', 'supporter', 'moduleadmin', 'admin', 'adopter' ];

var adminRoles = module.exports.adminRoles = [ 'moduleadmin', 'admin', 'adopter' ];


var orgUserSchema = new Schema({
  userId:                 { type: Schema.Types.ObjectId, ref: 'user', required: true },
  orgId:                  { type: Schema.Types.ObjectId, ref: 'organization', required: true },
  email:                  { type: String, required: true, index: { unique: true } },
  joined:                 { type: Date, default: Date.now },
  heldRoleAttrs:          { type: Schema.Types.Mixed },
  accApproved:            { type: Boolean, default: true },
  accApprovalHash:        { type: String }
});


var roles = {};
_.each(validRoles, function(r) {
  roles[r] = { type: Schema.Types.ObjectId, ref: r };
});

// dynamically constructs below schema from validRoles
// roles: {
//   supportee:    { type: Schema.Types.ObjectId, ref: 'supportee' },
//   supporter:    { type: Schema.Types.ObjectId, ref: 'supporter' }, 
//   moduleadmin:  { type: Schema.Types.ObjectId, ref: 'moduleadmin' },
//   admin:        { type: Schema.Types.ObjectId, ref: 'admin' },
//   adopter:      { type: Schema.Types.ObjectId, ref: 'adopter' }
// }

orgUserSchema.add({
  roles: roles
});



orgUserSchema.statics.new = function(newAttrs, callback){
  var orguser = new OrgUser();
  orguser.orgId = newAttrs.orgId;
  orguser.userId = newAttrs.userId;
  orguser.email = newAttrs.email;

  // do not mandate account approval for supporter
  // if user is also being added as an admin (adopter/admin/moduleadmin)
  var holdRoles = !_.some(newAttrs.roles || {}, function(v, k) {
    return _.contains(adminRoles, k);
  });

  async.waterfall([
    function(next) {

      if(_.isObject(newAttrs.roles) && !_.isArray(newAttrs.roles)) {
        if(holdRoles)  resolveHeldRoles(orguser, newAttrs.roles);
        return addRolesToUser(orguser, newAttrs.roles, next);
      }

      return next(null, orguser);
    },

    function(orguser, newRoles, next) {
      orguser.save(function(err){
        return next(err, orguser);
      });
    }

  ], function(err, orguser){
    return callback(err, orguser);
  });
}



orgUserSchema.methods.hasRole = function(roles){
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

  var self = this;

  this.removeRoleDocs(roles, function(err, unsetFields) {

    OrgUser.findOneAndUpdate({
      _id: self._id
    }, {
      $unset: unsetFields
    }, function(err, doc){
      return callback(err, doc);
    });

  });
}


orgUserSchema.methods.removeRoleDocs = function(roles, callback) {
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
          getUserRoleModel(role).remove({ _id: roleDocId }, function (err) {
            if(err) {
              return next(err);
            }
            unsetFields[unsetPrefix + role] = 1;
            return next();
          });
        }
    );
  });

  return async.parallel(delDocsTasks, function(err, results){
    if(err) {
      return callback(err);
    }
    return callback(null, unsetFields);
  });
}


orgUserSchema.statics.get = function(userId, orgId, callback) {
  this.findOne({ userId: userId, orgId: orgId }, function(err, orguser) {
    if(!orguser) {
      return callback(errors['USER_NOT_FOUND']());
    }
    return callback(err, orguser);
  });
}

orgUserSchema.statics.getPopulated = function(userId, orgId, callback) {
  this.get(userId, orgId, function(err, orguser) {
    if(err) {
      return callback(err);
    }

    if(!_.isObject(orguser.roles) || _.isEmpty(orguser.roles)) {
      return callback(orguser);
    }

    var popOpts = [];
    _.each(orguser.roles, function(roleDocId, role) {
      popOpts.push({ path: 'roles.' +  role });
    });

    orguser.populate(popOpts, function(err, ou) {
      return callback(err, ou);
    });
  });
}


orgUserSchema.statics.approveAccount = function(approvalAttrs, callback){
  this.findOne({ userId: approvalAttrs.userId, orgId: approvalAttrs.orgId, accApproved: false },
    function(err, orguser) {
      if(err) {
        return callback(err);
      }

      if(!orguser) {
        return callback(errors['USER_NOT_FOUND']());
      }

      orguser.accApproved = true;

      addRolesToUser(orguser, orguser.heldRoleAttrs, function(err, orguser, newRoles) {
        if(err) {
          return callback(err);
        }

        _.each(newRoles, function(v, k) {
          delete orguser.heldRoleAttrs[k];
        });

        orguser.markModified('heldRoleAttrs');
        orguser.save(function(err) {
          return callback(err, orguser);
        });

      });

    });
}


var getUserRoleModel = module.exports.getUserRoleModel = function(role) {
  var model = mongoose.model(role);
  if(!model) {
    throw new Error('Model not found: ' + role);
  }
  return model;
}


var OrgUser = module.exports.OrgUser = mongoose.model('orguser', orgUserSchema, 'orguser');




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


function resolveHeldRoles(orguser, userRoleAttrs) {
  var roleApprovalReq = Config.getConfig().app.roleApprovalReq;
  orguser.heldRoleAttrs = orguser.heldRoleAttrs || {};

  _.each(_.keys(userRoleAttrs), function(role) {
    var heldRole = _.contains(roleApprovalReq, role);

    if(heldRole) {
      orguser.heldRoleAttrs[role] = userRoleAttrs[role];
      orguser.accApproved = false;
      delete userRoleAttrs[role];
    }

  });

  if(!orguser.accApproved) {
    orguser.accApprovalHash = uuid.v4();
  }

  return orguser;
}


function addRolesToUser(orguser, userRoleAttrs, callback) {

  var roles = _.keys(userRoleAttrs);
  var newRoles = {};

  async.each(roles,
    function(role, next){
      var newRole = userRoleAttrs[role];
      if(_.isArray(newRole) || !_.isObject(newRole)) {
        return next(new Error('Expected object for role: ' + role));
      }

      getUserRoleModel(role).new(newRole, function(err, subUser){
        if(err){
          return next(err);
        }
        orguser.roles[role] = subUser._id;
        newRoles[role] = subUser;
        return next();
      });
    },
    function(err) {
      if(!err) {
        return callback(null, orguser, newRoles);
      }

      // remove orphans, if any
      var subDocs = _.toArray(newRoles);
      if(!_.isEmpty(subDocs)) {
        return removeDocs(subDocs, callback);
      }
      
      return callback(err);
    });
}
