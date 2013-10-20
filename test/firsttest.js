var env = process.env.NODE_ENV = (typeof process.env.NODE_ENV !== 'undefined') ? process.env.NODE_ENV : 'test';
// if(env !== 'test') throw new Error('Invalid env');

var config = require('../configLoader').forceEnv(env, true).init().getConfig()
  , Utils = require('./inc/dbutils')(config.db.dbUri)
  , Helpers = require('./inc/helpers')
  , util = require('util')
  , _ = require('lodash')

var UserModel = require('../model/user')
  , User = UserModel.User
  , OrgUserModel = require('../model/orguser')
  , OrgUser = OrgUserModel.OrgUser
  , Organization = require('../model/organization').Organization

var ObjectId = require('mongoose').Types.ObjectId;


var should = Helpers.should;

var state = {};

var print = function(name, obj){
  if(arguments.length == 1){
    obj = name;
    name = '';
  }
  console.log(name, util.inspect(obj, { depth: null }));
}


describe("DBTEST: -- Clearing DB --", function() {
  it(".", function(done) {
    Utils.clearDB(function(){
      done();
    })
  });
});

describe("DBTEST: Test User Model", function() {

  it("should create new organization", function(done) {
    var newOrgAttrs = {
      "id": "1",
      "displayName": "Massachusetts Institute of Technology",
      "orgURL": "mit",
      "code": "mitl",
      "city": "Cambridge",
      "region": "MA",
      "bannerURL": "/img/banners/mit.jpg"
    };

    Organization.new(newOrgAttrs, function(err, newOrg){
      // console.log(newOrg);
      should.not.exist(err);
      should.exist(newOrg);
      state.organization = newOrg;
      done();
    });
  });


  it("should register new user", function(done) {
    state.newUserAttrs = {
      email: 'shirishk.87@gmail.com',
      password: 'sa123',
      orgId: state.organization.id,
      roles: {
        supporter: {
          supportAreas: [ 'career' ]
        }
      }
    };

    User.register(state.newUserAttrs, function(err, user){
      should.not.exist(err);
      should.exist(user);
      state.user = user;
      done();
    });
  });

  it("should not have role: supporter ", function(done) {
    OrgUser.get(state.user._id, state.organization._id, function(err, orguser){
      should.not.exist(err);
      should.exist(orguser);
      should.not.exist(orguser.roles.supporter);
      done();
    });
  });


  it("should register new user 2", function(done) {
    state.newUserAttrs = {
      email: 'harishnk@gmail.com',
      password: 'sa123',
      orgId: state.organization.id,
      roles: {
        supporter: {
          supportAreas: [ 'career' ]
        },
        moduleadmin: {},
        admin: {}
      }
    };

    User.register(state.newUserAttrs, function(err, user){
      should.not.exist(err);
      should.exist(user);
      state.user = user;
      done();
    });
  });


  it("should find registered user by id and populate orgs", function(done) {
    User.findById(state.user._id).populate('organizations').exec(function(err, user){
      should.not.exist(err);
      should.exist(user);
      should.exist(user.organizations[0].id);
      done();
    });
  });


  it("should find an orguser and populate roles", function(done) {
    OrgUser.getPopulated(state.user._id, state.organization._id, function(err, orguser){
      // print(orguser.toObject());
      should.not.exist(err);
      should.exist(orguser);
      _.each(_.without(state.newUserAttrs.roles, 'supporter'), function(rId, role) {
        should.exist(orguser.roles[role]._id);
      });
      done();
    });
  });

  it("should add new role: adopter ", function(done) {
    OrgUser.get(state.user._id, state.organization._id, function(err, orguser){
      // print(orguser.toObject());
      should.not.exist(err);
      should.exist(orguser);

      orguser.addRoles({
        adopter: {}
      }, function(err, user){
          should.not.exist(err);
          should.exist(user);
          should.exist(user.roles.adopter);
          done();
      });
    });
  });


  it("should remove a role: moduleadmin", function(done) {
    OrgUser.get(state.user._id, state.organization._id, function(err, orguser){
      should.not.exist(err);
      should.exist(orguser);

      orguser.removeRoles([ 'moduleadmin' ], function(err, ou){
        // print(user.toObject());
        should.not.exist(err);
        ou.hasRole([ 'admin', 'adopter' ]).should.equal(true);
        ou.hasRole('moduleadmin').should.equal(false);
        should.not.exist(ou.roles.moduleadmin);
        done();
      });
    });

  });

});
