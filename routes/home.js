 var InviteRequestController = require('../controller/inviterequest').InviteRequest
   , passport = require('passport')

module.exports.index = function(req, res) {
  return res.ext.view('index.jade').render();
};

module.exports.public = function(app) {
  app.get('/register', function(req, res) {
    res.ext.view('register').data({ title: 'Register | Domo' }).render();
  });

  // app.post('/register', InviteRequestController.postInviteRequest.bind(InviteRequestController));
  app.get('/orglanding.jade', function(req, res){
    return res.ext.view('orglanding').data({ title: 'Welcome to Domo' }).render();
  });
};

