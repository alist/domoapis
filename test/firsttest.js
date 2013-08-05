var env = process.env.NODE_ENV = (typeof process.env.NODE_ENV !== 'undefined') ? process.env.NODE_ENV : 'test';
if(env !== 'test') throw new Error('Invalid env');

var Config = require('../configLoader').init(env)
  , Utils = require('./inc/utils')(Config.getConfig().db.dbUri)
  , Helpers = require('./inc/helpers')

var User = require('../model/user').User

var should = Helpers.should;

var state = {};

describe("DBTEST: -- Clearing DB --", function() {
  it(".", function(done) {
    Utils.clearDB(function(){
      done();
    })
  });
});

describe("DBTEST: Test User Model", function() {

  it("should register new user", function(done) {
    var newUserAttrs = {
      email: 'shirishk.87@gmail.com',
      password: 'sa123',
      roles: [ 'supporter', 'moduleadmin', 'admin' ]
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

      var opts = [];

      // set paths to be populated, based on roles
      user.roles.forEach(function(role){
        opts.push({ path: role + 'Role', select: 'flag' });
      });

      User.populate(user, opts, function (err, user) {
        console.log('user', user);
        should.not.exist(err);
        should.exist(user);
        done();
      });

    });
  });

});
