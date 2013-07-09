secrets = require ('../secrets')

comsModel = require('./communications')

mongoose = require('mongoose')

Schema = mongoose.Schema

ObjectId = mongoose.SchemaTypes.ObjectId

InviteRequestSchema = new Schema {
emailAddress: String
organization: String
invited: Number
invitedOn: Date
}


InviteRequest = mongoose.model 'InviteRequest', InviteRequestSchema
exports.InviteRequest = InviteRequest
  
mongoose.connect(secrets.mongoDBConnectURLSecret)

exports.setEmailAddress = (emailAddress, callback) -> #callback(err)
  if emailAddress.length > 0
    inviteRequest = new InviteRequest {emailAddress: emailAddress, invitedOn: new Date() }
    inviteRequest.save (err) ->
      if err?
        callback err
      else
        comsModel.notifyAllUsersOfPermission 'marketing',"new invite request from #{emailAddress}", (err) ->
          if err?
            console.log "notified everyone who's admin with err #{err}"
            callback err
          else
            callback null
  else
    callback "empty email address"