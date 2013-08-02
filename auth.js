
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , UserController = require('./controller/user').UserController



module.exports = function(AppLoader){

  AppLoader.on('sessionHook', function(app){
    app.use(passport.initialize());
    app.use(passport.session());
  });


  AppLoader.on('middlewareHook', function(app){
    passport.use(new LocalStrategy({ passReqToCallback: true },
      function(req, username, password, done) {
        return UserController.auth(username, password, done);
      }
    ));

    passport.serializeUser(function(user, done) {
      done(null, user);
    });

    passport.deserializeUser(function(user, done) {
      UserController.findUserById(user.id, function (err, user) {
        done(err, user);
      });
    });
  });

}