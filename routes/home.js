 var UserController = require('../controller/user').UserController
   , passport = require('passport')
   , _ = require('lodash')


module.exports.public = function(app) {

  // homepage
  app.get('/', function(req, res) {
    if(_.first(req.flash('accApproved')) === true) {
      res.ext.data({ accApproved: true, roles: req.flash('roles').join(', ') });
      return res.ext.view('supporterApprovalStatus.jade').render();
    }

    if(req.user) {
      UserController.populateOrgs(req,res,function(user_json){
        console.log('msg')
        req.user = user_json
        if(req.user.organizations.length == 1)
          return res.redirect('/' + req.user.organizations[0].orgURL + '/giveadvice')
        res.ext.data({ user: req.user });
        return res.ext.view('supporterprofile.jade').render();
      })
    }
    else{
      return res.ext.view('index.jade').render();
    }
  });

  // privacyandterms
  app.get('/privacyandterms', function(req, res) {

    return res.ext.view('privacyandterms.jade').render();
  });


  app.get('/login', function(req, res){
    if(req.isAuthenticated()) {
      return res.ext.redirect('/');
    }
    return res.ext.view('login.jade').render();
  });

  app.post(
    '/login',
    passport.authenticate('local'),
    UserController.newSession.bind(UserController)
  );

  app.get('/logout', UserController.logout.bind(UserController));

  app.get('/register', UserController.getRegister.bind(UserController));
  app.post('/register', UserController.register.bind(UserController));

  app.get('/o/:orgId/u/:userId/account/approval', UserController.approveAccount.bind(UserController));

  app.get('/orglanding.jade', function(req, res){
    return res.ext.view('orglanding').data({ title: 'Welcome to Domo' }).render();
  });
};
