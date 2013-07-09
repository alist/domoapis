inviteRequestModel = require('../model/inviterequest')

exports.home = (req, res) ->
  #@render index: {}
  @render 'index.jade'

exports.postInviteRequest = (req, res) ->
  emailAddress = req.body.emailAddress
  inviteRequestModel.setEmailAddress emailAddress, (err) =>
    if err? == false
      console.log "added email address of #{emailAddress}"
      @send {status: 'success'}
    else
      console.log "couldn't set email address: #{emailAddress} w/ err #{err}"
      @send {status: 'bad'}
      