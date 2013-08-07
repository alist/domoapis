var env = process.env.NODE_ENV = (typeof process.env.NODE_ENV !== 'undefined') ? process.env.NODE_ENV : 'test';
if(env !== 'test') throw new Error('Invalid env');

var Config = require('../configLoader').init(env)
  , Utils = require('./inc/utils')(Config.getConfig().db.dbUri)
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
      "city": "Cambridge",
      "region": "MA",
      "bannerURL": "/img/banners/mit.png"
    };

    Organization.newOrganization(newOrgAttrs, function(err, newOrg){
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
      orgId: state.organization._id,
      roles: {
        supporter: {
          supportAreas: [ 'career' ]
        },
        admin: {

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


  // it("should find registered user by id and populate", function(done) {

  //   User.findById(state.user._id, function(err, user){
  //     should.not.exist(err);
  //     should.exist(user);

  //     var opts = [];

  //     // set paths to be populated, based on roles
  //     var org;
  //     user.organizations.forEach(function(org){
  //       Object.keys(org.roles.toObject()).forEach(function(role){
  //         opts.push({ path: 'organizations.roles.' + role });
  //       });
  //     });
  //     // console.log('opts', opts);

  //     // pre-populate
  //     // print('user', user.toObject());

  //     User.populate(user, opts, function (err, user) {
  //       // print('user', user.toObject());
  //       var userRoleAttrs = _.keys(state.newUserAttrs.roles)
  //       var hasRole;

  //       UserModel.validRoles.forEach(function(role){
  //         hasRole = user.hasRolesInOrg(state.organization._id, role);
  //         hasRole.should.equal(userRoleAttrs.indexOf(role) > -1)
  //       });

  //       should.not.exist(err);
  //       should.exist(user);
  //       state.user = user;
  //       done();
  //     });

  //   });
  // });


  it("should add new role", function(done) {
    OrgUser.findOne({ userId: state.user._id, orgId: state.organization._id }, function(err, orguser){
      should.not.exist(err);
      should.exist(orguser);

      orguser.addRoles({
        adopter: {

        }
      }, function(err, user){
          should.not.exist(err);
          should.exist(user);
          should.exist(user.roles.adopter);
          done();
      });
    });


  });


  it("should remove a role", function(done) {
    OrgUser.findOne({ userId: state.user._id, orgId: state.organization._id }, function(err, orguser){
      should.not.exist(err);
      should.exist(orguser);
      
      orguser.removeRoles([ 'supporter' ], function(err, user){
        // print(user.toObject())
        should.not.exist(err);
        should.not.exist(user.roles.supporter);
        done();
      });
    });

  });

});
