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
  if emailAddress?.length > 0
    inviteRequest = new InviteRequest {emailAddress: emailAddress, invitedOn: new Date() }
    inviteRequest.save (err) ->
      if err?
        callback err
      else
        callback null
        #this doesn't need to be w/in the error handling
        comsModel.notifyAllUsersOfPermission 'superhuman',"new invite request from #{emailAddress}", (err) ->
          if err?
            console.log "error notifying with err #{err}"
  else
    callback "empty email address"