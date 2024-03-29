var OrganizationModel = require("../model/organization").Organization
  , User = require('../model/user')
  , UserModel = User.User
  , OrgUser = require('../model/orguser')
  , OrgUserModel = OrgUser.OrgUser
  , Validator = require('validator').Validator
  , _ = require('lodash')
  , errors = require('../model/errors').errors
  , async = require('async')


var OrgUserController = function(){
};


OrgUserController.prototype.getUsersByOrgId = function(req, res){
    var response = res.ext.json();

    var isCollectionQuery = true;

    var query  = { orgId: req.extras.organization._id };
    if(!!req.params.userId) {
        query._id = req.params.userId;
        isCollectionQuery = false;
    }

    var popOpts = { path: '', select: '-__v -flag' };

    _.each(OrgUser.validRoles, function(role) {
        popOpts.path += 'roles.' +  role + ' ';
    });

    var orgusers = [];

    var stream = OrgUserModel
      .find(query)
      .select('email roles joined accApproved')
      .populate(popOpts)
      .lean()
      .stream()
      .on('data', function(orguser) {
          orgusers.push(orguser);
      })
      .on('error', function(err) {
          response.error(errors['USER_NOT_FOUND'](err));
      })
      .on('close', function() {
          if(!orgusers.length) {
              return response.error(errors['USER_NOT_FOUND']()).render();
          }
          if(isCollectionQuery) {
              return response.data({ users: orgusers }).render();
          }
          return response.data({ user: orgusers[0] }).render();
      });
}


OrgUserController.prototype.deleteUser = function(req, res){
  var response = res.ext.json();
  // TODO: validate
  var query  = { orgId: req.extras.organization._id, _id: req.params.userId };

  OrgUserModel.findOne(query, function(err, orguser) {
    if(err || !orguser) {
      return response.error(errors['USER_NOT_FOUND'](err)).render();
    }

    async.parallel([
      function(next) {
        UserModel.remove({ _id: orguser.userId }, function(err) {
          return next(err);
        });
      },
      function(next) {
        orguser.removeRoleDocs(_.keys(orguser.roles.toObject()), function(err, unsetFields) {
          return next(err);
        });

      }
    ], function(err, results) {
      if(err) {
        return response.error(err).render();
      }

      orguser.remove(function(err) {
        if(err) {
          return response.error(err).render();
        }
        return response.data(orguser.toObject()).render();
      });

    });

  });

}


OrgUserController.prototype.addRole = function(req, res){
  var response = res.ext.json();
  // TODO: validate
  var query  = { orgId: req.extras.organization._id, _id: req.params.userId };

  var newRole = req.params.role;
  var validRoles = OrgUser.validRoles;

  if(!_.contains(validRoles, newRole)) {
    return response.error(errors['INVALID_ROLE']()).render();
  }

  var newRoleAttrs = req.body[newRole];
  if(!_.isObject(newRoleAttrs)) {
    return response.error(errors['INVALID_ARG']('Invalid request body')).render();
  }

  OrgUserModel.findOne(query, function(err, orguser) {
    if(err || !orguser) {
      return response.error(errors['USER_NOT_FOUND'](err)).render();
    }

    if(orguser.hasRole(newRole)) {
      return response.error(errors['ROLE_EXISTS']()).render();
    }

    var role = {};
    role[newRole] = newRoleAttrs;

    orguser.addRoles(role, function(err, orguser) {
      if(err) {
        return response.error(errors['OP_FAIL'](err)).render();
      }
      return response.data({ user: orguser.toObject() }).render();
    });
  });
}


OrgUserController.prototype.deleteRole = function(req, res){
  var response = res.ext.json();
  // TODO: validate
  var query  = { orgId: req.extras.organization._id, _id: req.params.userId };
  var deleteRole = req.params.role;

  OrgUserModel.findOne(query, function(err, orguser) {
    if(err || !orguser) {
      return response.error(errors['USER_NOT_FOUND'](err)).render();
    }

    if(!orguser.hasRole(deleteRole)) {
      return response.error(errors['ROLE_NOT_FOUND']()).render();
    }

    orguser.removeRoles([ deleteRole ], function(err, orguser) {
      if(err) {
        return response.error(errors['OP_FAIL'](err)).render();
      }
      return response.data({ user: orguser.toObject() }).render();
    });
  });
}



module.exports.OrgUserController = new OrgUserController();