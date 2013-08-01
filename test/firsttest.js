var env = process.env.NODE_ENV = (typeof process.env.NODE_ENV !== 'undefined') ? process.env.NODE_ENV : 'test';
if(env !== 'test') throw new Error('Invalid env');

var Utils = require('./inc/utils')
  , Helpers = require('./inc/helpers')
  , User = require('../model/user').User

var should = Helpers.should;

var state = {};

describe("DBTEST: -- Clearing DB --", function() {
  it(".", function(done) {
      console.log('hey')
      done();
    // Following is what I do to ensure tests are run in a sanitized env
    // Utils.clearDB(function(){
    //   done();
    // })
  });
});

describe("DBTEST: Test User Model", function() {

  it("should register new user", function(done) {
    var newUserAttrs = {
      email: 'shirishk.87@gmail.com',
      password: 'sa123',
      roles: [ 'admin' ]
    };

    User.register(newUserAttrs, function(err, user){
      should.not.exist(err);
      should.exist(user);
      state.user = user;
      done();
    });
  });

});
