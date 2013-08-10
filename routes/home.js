 var UserController = require('../controller/user').UserController
   , passport = require('passport')


module.exports.index = function(req, res) {
  return res.ext.view('index.jade').render();
};

module.exports.public = function(app) {
  app.get('/register', UserController.getRegister.bind(UserController));
  app.post('/register', UserController.register.bind(UserController));

  app.get('/orglanding.jade', function(req, res){
    return res.ext.view('orglanding').data({ title: 'Welcome to Domo' }).render();
  });
};

