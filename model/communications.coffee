secrets = require ('../secrets')
userModel = require('./user')
twilioClient = require('twilio').Client
Twiml = require 'twilio/lib/twiml'

exports.notifyUser = (userID, message, callback) -> #callback(err)
  userModel.getUserWithID userID, (err, author, abrv) =>
    if author?
      timeInterval = Math.abs(author.lastNotificationDate?.getTime() - new Date().getTime())
      if ((timeInterval > author.notificationInterval) || (author.overIntervalMessageAllowanceCount > author.messageCount) || (author.lastNotificationDate? == false))
        exports.processMessageToRecipientForSMS message, author.telephoneNumber, exports.sendSMS, (error, recipient) =>
          if error? && callback?
            callback "sms error to #{recipient}: #{error}"
          else
            userModel.User.update {userID: author.userID},{$set: {lastNotificationDate: new Date()}, $inc: {messageCount: 1} }, {upsert: 0}, (error) ->
              if error? && callback?
                callback "couldn't update author to new notify date"
              else if callback?
                callback null
                console.log "notified #{recipient}"
      else
        if callback?
          callback "no notify; only #{timeInterval}# of seconds since last notfiy."

exports.notifyAllUsersOfPermission = (permission, message, callback) -> #callback(err)
  userModel.allUsersWithPermission permission, (err, users) =>
    for user in users
      exports.notifyUser user.userID, message, (err) =>
        if err?
          console.log "err w. sms to userID #{user.userID} err: #{err}"
    callback err

twilio = null
phone = null
exports.comSetup = (app) ->
  port = if process.env.PORT > 0 then process.env.PORT else 3000
  twilio = new twilioClient secrets.twilioAccountSid, secrets.twilioAuthToken, secrets.primaryHost, {port: port, express: app.app}
  autoUri = global.autoUri
  autoUri.baseUri = 'https://' + autoUri.hostname + '/' + autoUri.basePath + '/'
  phone = twilio.getPhoneNumber('+16173000557')
  phone.setup =>
    phone.on 'incomingSms', (reqParams, res) ->
      message = reqParams?.Body
      console.log "received sms: #{message}!:", reqParams
      senderPhoneNumber = reqParams?.From
      responsesForMessageBySender message, senderPhoneNumber, (error, responseMessageRecipientTuple) =>
        for messageTuple in responseMessageRecipientTuple
          processMessageToRecipientForSMS messageTuple[0], messageTuple[1], sendSMS, (error, recipient)=>
            if error?
              console.log "error processing message to recipient #{recipient}: #{error}"
   
    console.log "twilio ready on port #{port}"
    
  
exports.processMessageToRecipientForSMS = (message, recipient, sendSMSCallback, completionCallback) -> #smsSendCallback(message, recipient, callback), completionCallback(error, recipient)
  #if too long, break into pieces labeled (1/2) (2/2), then sendSMS
  if message? == false
    completionCallback('no message error', recipient)
    return
  if recipient? == false || recipient.length < 9
    completionCallback('no or invalid recipient error', recipient)
    return
  
  if message.length <= smsLength
    sendSMSCallback message, recipient, (error) =>
      completionCallback error,recipient
  else
    msgNoEx = "(1/2)"
    outputSMS = []
    #first we get raw count, then we'll add in the tags for sms#
    messageCount = Math.ceil(message.length / smsLength)
    messageCount = Math.ceil((messageCount * msgNoEx.length + message.length)/smsLength)
    if messageCount > 9
      completionCallback 'message too long error', recipient
    else
      characterQueue = message
      for i in [1..messageCount]
        outputMsg = "(#{i}/#{messageCount})"
        characterCountUsed = smsLength-msgNoEx.length
        outputMsg = outputMsg.concat characterQueue.slice(0, characterCountUsed)
        outputSMS.push outputMsg
        characterQueue = characterQueue.slice characterCountUsed
    for msg in outputSMS
      if msg == outputSMS[outputSMS.length - 1] #last one of the bunch says if we've completed
        sendSMSCallback msg, recipient, (error) =>
          if error?
            console.log "sms send error #{error}"
          
          completionCallback(error, recipient)
      else
        sendSMSCallback msg, recipient, (error) =>
          if error?
            console.log "sms send error #{error}"

#messageIO
smsLength = 160
exports.sendSMS = (message, recipient, callback) -> #callback(error)
  #if recipient, attempt send, if fail, respond with error
  if recipient? == false || recipient.length < 9
    callback('no or invalid recipient error')
    return
  if message? == false || message.length == 0
    callback 'undefined message error'
    return
  if message.length > smsLength
    callback('overlength message error')
    return

  phone.sendSms recipient, message ,  null, (sms) =>
    console.log sms #hnktest+
    sendStatus = sms?.smsDetails?.status
    if sendStatus == 'queued'
      callback() #unfortunately, only possible to get callback on server
    else
      callback "error with sms sending #{sendStatus}"
    sms.on 'processed', (reqParams, response) =>
      console.log "sms processed with response #{response} reqParams #{reqParams} to # #{recipient}"
