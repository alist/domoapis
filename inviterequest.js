var InviteRequest, InviteRequestSchema, ObjectId, Schema, comsModel, mongoose, secrets;

secrets = require('../secrets');

comsModel = require('./communications');

mongoose = require('mongoose');

Schema = mongoose.Schema;

ObjectId = mongoose.SchemaTypes.ObjectId;

InviteRequestSchema = new Schema({
  emailAddress: String,
  organization: String,
  invited: Number,
  invitedOn: Date
});

InviteRequest = mongoose.model('InviteRequest', InviteRequestSchema);

exports.InviteRequest = InviteRequest;

exports.setEmailAddress = function(emailAddress, callback) {
  var inviteRequest;
  if ((emailAddress != null ? emailAddress.length : void 0) > 0) {
    inviteRequest = new InviteRequest({
      emailAddress: emailAddress,
      invitedOn: new Date()
    });
    return inviteRequest.save(function(err) {
      if (err != null) {
        return callback(err);
      } else {
        callback(null);
        return comsModel.notifyAllUsersOfPermission('deskjobber', "new invite request from " + emailAddress, function(err) {
          if (err != null) {
            return console.log("error notifying with err " + err);
          }
        });
      }
    });
  } else {
    return callback("empty email address");
  }
};
