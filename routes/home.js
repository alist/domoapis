 var InviteRequestController = require('../controller/inviterequest').InviteRequest
   , passport = require('passport')

module.exports.index = function(req, res) {
  return res.ext.view('index.jade').render();
};

/*module.exports.public = function(app) {
  // app.post('/register', InviteRequestController.postInviteRequest.bind(InviteRequestController));
  app.get('/orglanding.jade', function(req, res){
    return res.ext.view('orglanding').data({ title: 'Welcome to Domo' }).render();
  });
};*/

/*exports.postInviteRequest = function(req, res) {
  var emailAddress,
    _this = this;
  emailAddress = req.body.emailAddress;
  return inviteRequestController.setEmailAddress(emailAddress, function(err) {
  });
};*/

/*exports.getOrgSelect = function(req, res) {
  var org,
    _this = this;
  org = req.body.org; //how do we set this in the req body of orglanding page
  //ask the user for their organization. Once selected, redirect user to orglanding.jade, their org's homepage. Pass selected org in req body
  return this.render('/orglanding.jade');
};*/