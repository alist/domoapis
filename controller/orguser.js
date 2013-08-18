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
      .select('email roles joined')
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
  console.log('query', query)
  OrgUserModel.findOne(query, function(err, orguser) {
    if(err || !orguser) {
      return response.error(errors['USER_NOT_FOUND'](err)).render();
    }

    async.parallel([
      function(next) {
        console.log('orguser.userId', {_id: orguser.userId })
        UserModel.remove({ _id: orguser.userId }, function(err) {
          return next(err);
        });
      },
      function(next) {
        console.log('orguser.roles', _.keys(orguser.roles.toObject()))
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

module.exports.OrgUserController = new OrgUserController();