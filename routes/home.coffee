inviteRequestModel = require('../model/inviterequest')

exports.home = (req, res) ->
  #@render index: {}
  @render 'index.jade', layout: 'layout.jade'

exports.postInviteRequest = (req, res) ->
  emailAddress = req.body.emailAddress
  console.log "hit post method"
  console.log emailAddress
  inviteRequestModel.setEmailAddress emailAddress, (err) =>
    console.log err
    if err? == false
      @send {status: 'success'}
    else
      console.log "couldn't set email address: #{emailAddress} w/ err #{err}"
      @send {status: 'bad'}
      
exports.registerInviteRequest = (req, res) ->
  emailAddress = @params.emailAddress
  console.log "hit get method"
  console.log emailAddress
  inviteRequestModel.setEmailAddress emailAddress, (err) =>
    console.log err
    if err? == false
      @send {status: 'success'}
    else
      console.log "couldn't set email address: #{emailAddress} w/ err #{err}"
      @send {status: 'bad'}