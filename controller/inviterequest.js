var inviteRequestModel = require('../model/inviterequest');



var InviteRequestController = function() {
};

InviteRequestController.prototype.addEmailAddress = function(req, res){
//function(emailAddress, callback) {
  var emailAddress = req.body.emailAddress;
  var _this = this;

  inviteRequestModel.setEmailAddress(emailAddress, function(err) {
    if ((err !== null) === false) {
      console.log("added email address of " + emailAddress);
      return res.send({
        status: 'success'
      });
    } else {
      console.log("couldn't set email address: " + emailAddress + " w/ err " + err);
      return res.send({
        status: 'bad'
      });
    }
  });
};

module.exports.InviteRequestController = new InviteRequestController();
