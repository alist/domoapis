var env = process.env.NODE_ENV = (typeof process.env.NODE_ENV !== 'undefined') ? process.env.NODE_ENV : 'test';
// if(env !== 'test') throw new Error('Invalid env');

var config = require('../configLoader').forceEnv(env, true).init().getConfig()
  , Utils = require('./inc/dbutils')(config.db.dbUri)
  , Helpers = require('./inc/helpers')
  , util = require('util')
  , _ = require('lodash')
  , async = require('async')

var UserModel = require('../model/user')
  , User = UserModel.User
  , OrgUserModel = require('../model/orguser')
  , OrgUser = OrgUserModel.OrgUser
  , Organization = require('../model/organization').Organization
  , SupporterModel = require('../model/user_supporter')

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


describe("LOAD_DATA: -- Clearing DB --", function() {
  it(".", function(done) {
    Utils.clearDB(function(){
      done();
    })
  });
});

function genRandomCode(o) {
  o.code = o.orgURL.substring(0, 4);
  if(o.code.length < 4) {
    o.code = o.code + Math.random().toString(36).substring(2, 6 - o.code.length);
  }
  return o;
}


function genRandomOrgId(u) {
  if(u.orgId) {
    return u;
  }
  var rndOrg = state.organizations[_.random(state.organizations.length - 1)];
  u.orgId = rndOrg.id;
  return u;
}


function genRandomRoles(u) {
  if(u.roles && Object.keys(u.roles) > 0) {
    return u;
  }

  u.roles = {};

  var validRoles = _.without(OrgUserModel.validRoles, 'adopter');
  var validSupportAreas = SupporterModel.validSupportAreas;

  var uroleCount = _.random(1, validRoles.length - 1);

  var remRoles, rndRole;
  _.times(uroleCount, function(n) {
    remRoles = _.difference(validRoles, _.keys(u.roles));
    rndRole = remRoles[_.random(remRoles.length - 1)];
    u.roles[rndRole] = {};
    if(rndRole === 'supporter') {
      u.roles[rndRole].supportAreas = validSupportAreas[_.random(validSupportAreas.length - 1)];
    }
  });
  return u;
}



describe("LOAD_DATA", function() {

  it("Load organizations", function(done) {
    var orgData = require('./data/orgData').orgData;

    state.organizations = [];

    var stats = {
      failed: 0,
      success: 0
    };

    async.each(orgData, function(o, next) {
      genRandomCode(o);
      Organization.new(o, function(err, newOrg){
        err ? stats.failed++ : stats.success++;
        next();
      });
    }, function(err) {
      console.log('Success: ' + stats.success + ' | Failed: ' + stats.failed);
      Organization.find({}, function(err, orgs) {
        state.organizations = orgs;
        done(err);
      });
    });
  });


  it("Load users", function(done) {

    var userData = require('./data/userData').userData;

    var stats = {
      failed: 0,
      success: 0
    };

    async.each(userData, function(u, next) {

      async.waterfall([
        function(next2) {
          genRandomOrgId(u);
          genRandomRoles(u);
          return next2();
        },

        function(next2) {
          User.register(u, function(err, newUser, orguser, org) {
            return next2(err, newUser, orguser, org);
          });
        },

        function(user, orguser, org, next2) {
          if(orguser.accApproved) {
            return next2();
          }

          OrgUser.approveAccount({ userId: user._id, orgId: org._id }, next2);
        }
      ], function(err, result) {
        err ? stats.failed++ : stats.success++;
        next(err);
      });
      
    }, function(err) {
      console.log('Success: ' + stats.success + ' | Failed: ' + stats.failed);
      done();
    });

  });
});