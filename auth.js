
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , UserController = require('./controller/user').UserController



module.exports = function(app){

  passport.use(new LocalStrategy({ passReqToCallback: true },
    function(req, username, password, done) {
      return UserController.auth(req, username, password, done);
    }
  ));

  passport.serializeUser(function(user, done) {
    var sessionObj = {
      userID: user.userID
    };
    done(null, sessionObj);
  });

  passport.deserializeUser(function(sessionObj, done) {
    UserController.findUserById(sessionObj.userID, function (err, user) {
      done(err, user);
    });
  });


  app.use(passport.initialize());
  app.use(passport.session());
}