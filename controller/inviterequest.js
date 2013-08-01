var inviteRequestModel = require('../model/inviterequest');

exports.setEmailAddress = function(emailAddress, callback) {
var _this = this;

  inviteRequestModel.setEmailAddress(emailAddress, function(err) {
    if ((err !== null) === false) {
      console.log("added email address of " + emailAddress);
      return _this.send({
        status: 'success'
      });
    } else {
      console.log("couldn't set email address: " + emailAddress + " w/ err " + err);
      return _this.send({
        status: 'bad'
      });
    }
  });
};