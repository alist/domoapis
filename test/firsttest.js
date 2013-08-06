var env = process.env.NODE_ENV = (typeof process.env.NODE_ENV !== 'undefined') ? process.env.NODE_ENV : 'test';
if(env !== 'test') throw new Error('Invalid env');

var Config = require('../configLoader').init(env)
  , Utils = require('./inc/utils')(Config.getConfig().db.dbUri)
  , Helpers = require('./inc/helpers')
  , util = require('util')

var User = require('../model/user').User
  , Organization = require('../model/organization').Organization

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
    var newUserAttrs = {
      email: 'shirishk.87@gmail.com',
      password: 'sa123',
      organizationId: state.organization._id,
      roles: {
        supporter: {
          supportAreas: [ 'career' ]
        },
        moduleadmin: {

        },
        admin: {

        }
      }
    };

    User.register(newUserAttrs, function(err, user){
      should.not.exist(err);
      should.exist(user);
      state.user = user;
      done();
    });
  });


  it("should find registered user by id and populate", function(done) {

    User.findById(state.user._id, function(err, user){
      should.not.exist(err);
      should.exist(user);

      var opts = [];

      // set paths to be populated, based on roles
      var org;
      user.organizations.forEach(function(org){
        Object.keys(org.roles.toObject()).forEach(function(role){
          opts.push({ path: 'organizations.roles.' + role });
        });
      });
      // console.log('opts', opts);

      // pre-populate
      // print('user', user.toObject());

      User.populate(user, opts, function (err, user) {
        print('user', user.toObject());
        should.not.exist(err);
        should.exist(user);
        done();
      });

    });
  });

});
