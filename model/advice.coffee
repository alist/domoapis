secrets = require ('../secrets')

comsModel = require('./communications')
crypto = require('crypto')
shorturlModel = require('../model/shorturl')

mongoose = require('mongoose')
Schema = mongoose.Schema

ObjectId = mongoose.SchemaTypes.ObjectId

ResponseSchema = new Schema {
adviceResponse: String
user: {displayName: String, userID: String}
modifiedDate: Date
helpful: Number
status: String
}

AdviceSchema = new Schema {
  modifiedDate: {type: Date, index: {unique: false}}
  createdDate: {type: Date, index: {unique: false}}
  adviceRequest: {type: String} #rename to request
  responses: [ResponseSchema]
  adviceContact: {type: String}
  status: {type: String}
  authToken: {type: String}
  accessToken: {type: String, index: {unique: true}}
}

Advice = mongoose.model 'Advice', AdviceSchema
exports.Advice = Advice
  
mongoose.connect(secrets.mongoDBConnectURLSecret)

genCode = (length, salt) ->
  current_date = (new Date()).valueOf().toString()
  random = Math.random().toString()
  hash = crypto.createHash('sha1').update(current_date + random + salt).digest('base64')
  #assuming not all characters are forward slashes
  hash = hash.replace(/\//g,'')
  if length > hash.length
    return hash
  else return hash.substr(0, length)


exports.addResponse = (adviceID, adviceResponse, userInfoToStore, callback) -> #callback (err, responseUpsert)
  if adviceResponse? == true && adviceResponse.length > 0
    exports.getAdviceWithID adviceID, (err, advice) =>
      if advice?
        responseUpsert = {adviceResponse: adviceResponse, status:'PAPP', user: userInfoToStore, modifiedDate: new Date(), createdDate: new Date()}
        Advice.update {_id: objectIDWithID(adviceID)},{$set: {modifiedDate: new Date()}, $push: {responses: responseUpsert}}, {upsert: 0}, (err) =>
          if err? == false
            comsModel.notifyAllUsersOfPermission 'admin', "new pending advice response at http://domo.io/giveadvice/#{adviceID}", (err)->
              callback err, responseUpsert
          else callback "error for advice save #{err}"
      else callback "no advice with adviceID #{adviceID}"
  else callback "no advice response given"
    

exports.addAdvice = (adviceRequest, adviceContact, userInfo, callback) -> #callback (err, advice)
  if adviceRequest? == true && adviceRequest.length > 0
   accessToken = genCode 12, adviceContact
   authToken = genCode 4, accessToken
   advice = new Advice {modifiedDate: new Date(), adviceRequest: adviceRequest, adviceContact: adviceContact, userInfo: userInfo, status: 'PAPP', authToken: authToken, accessToken: accessToken}
   advice.save (err) ->
    if err?
      callback "error for advice save #{err}"
    else
      comsModel.notifyAllUsersOfPermission 'admin',"new advice to approve at http://domo.io/giveadvice/admin", (err) ->
        console.log "notified everyone who's admin with err #{err}"
      callback null, advice
  else
    callback "no advice given"

exports.getAdviceSinceDate = (date, callback) ->
  Advice.find {modifiedDate : {$gt: date}}, {},{sort: {createdDate: -1, modifiedDate: -1 }}, (err, advice) =>
    callback err, advice


exports.getAdvice = (status, callback) ->
  Advice.find {status: status}, {},{ sort: {createdDate: -1, modifiedDate: -1 }}, (err, advice) =>
    callback err, advice

objectIDWithID = (id) ->
  try
    objID = mongoose.mongo.BSONPure.ObjectID.fromString(id)
    return objID
  catch err
    console.log "not a objID #{id} err #{err}"
  return null
 

exports.flagAdviceRequest = (adviceID, callback) -> #callback(err)
  exports.getAdviceWithID adviceID, (err, advice) ->
    if advice?
      newStatus = "FLAG"
      if advice.status == newStatus
        callback "advice for id #{adviceID} is already #{newStatus}"
      else
        advice.status = newStatus
        advice.save (err) =>
          callback err
    else callback "no advice for id #{adviceID}"
    
exports.approveAdviceRequest = (adviceID, callback) -> #callback(err)
  exports.getAdviceWithID adviceID, (err, advice) ->
    if advice?
      newStatus = "PRES"
      if advice.status == newStatus
        callback "advice for id #{adviceID} is already #{newStatus}"
      else
        advice.status = newStatus
        advice.save (err) =>
          callback err
    else callback "no advice for id #{adviceID}"
 
exports.notifyAdviceOwnerOfUpdate = (advice, callback) -> #callback(err)
  phone = advice.adviceContact
  if phone?.length <6
    callback "no phone number for advice of accessToken #{advice.accessToken}"
    return
  adviceAccessURL = "https://oh.domo.io/viewadvice/#{advice.accessToken}"
  shorturlModel.shorten adviceAccessURL, 4, null, true, null, null, (err, shortURL) =>
    if err?
      console.log "shortening error #{err}"
    message = "new advice at http://domo.io/x/#{shortURL.shortURICode} with auth code #{advice.authToken}"
    comsModel.processMessageToRecipientForSMS message, phone, comsModel.sendSMS, (err, recipient) =>
      callback err

exports.notifyAdviceGiverOfHelpfulResponse = (advice, userID, callback) -> #callback(err)
  adviceGiverURL = "https://oh.domo.io/giveadvice/#{advice._id.toString()}"
  shorturlModel.shorten adviceGiverURL, 4, null, true, null, null, (err, shortURL) =>
    message = "your response was appreciated at http://domo.io/x/#{shortURL.shortURICode} ! Check it out where you're logged-in!"
    comsModel.notifyUser userID, message, (err) =>
      console.log "ahh #{err}"
      callback err

exports.approveResponseWithAdviceRequestIDAndIndex = (adviceRequestID, adviceIndex, callback) -> #callback(err, advice)
  exports.getAdviceWithID adviceRequestID, (err, advice) =>
    if advice?
      if advice.responses[adviceIndex]? == true
        advice.responses[adviceIndex]?.status = "APPR"
        advice.save (err) =>
          if err?
            callback err, advice
            return
          #notify owner of this advice
          callback err, advice
          if advice.adviceContact?
            exports.notifyAdviceOwnerOfUpdate advice, (errComs) =>
              if errComs?
                console.log "err in advice-owner of:#{adviceRequestID} notification: #{err}"

      else
        callback "no response at index #{adviceIndex} for adviceReq with accessToken #{adviceRequestID}"
    else
      callback err

exports.getAdviceWithID = (adviceID, callback) -> #callback (err, advice)
  try
    objID = mongoose.mongo.BSONPure.ObjectID.fromString(adviceID)
  catch err
    console.log "not a objID #{adviceID}"
  Advice.findOne {_id : objID}, (err, advice) =>
    callback err, advice

exports.getAdviceWithAccessAndAuthTokens = (accessToken, authToken, callback) -> #callback (err, advice)
  Advice.findOne {accessToken : accessToken, authToken: authToken}, (err, advice) =>
    callback err, advice

exports.getAdviceWithToken = (token, callback) -> #callback (err, advice)
  Advice.findOne {accessToken : token}, (err, advice) =>
    callback err, advice

#returns an advice obj appropiate for display for a particular permission
exports.sanatizedAdviceForPermission = (advice, permission) ->
  if advice? == false
    return null
  if permission == "admin"
    return advice
  else if permission == "supporter"
    return advice
  else #prob a user
    apprResponses = []
    for response in advice?.responses
      if response.status == "APPR"
        apprResponses.push(response)
    advice.responses = apprResponses
    return advice
     

exports.setAdviceHelpfulWithAccessAndAuthTokens = (accessToken, authToken, adviceIndex, callback) -> #callback(err, advice)
  exports.getAdviceWithAccessAndAuthTokens accessToken, authToken, (err, advice) =>
    if advice?
      if advice.responses[adviceIndex]? == true
        advice.responses[adviceIndex]?.helpful = 1
        advice.save (err) =>
          exports.notifyAdviceGiverOfHelpfulResponse advice, advice.responses[adviceIndex].user.userID, (err) ->
            if err?
              err1 = "err in advice-giver helpful notification: #{err}"
            callback err1, advice
      else
        callback "no response at index #{adviceIndex} for adviceReq with accessToken #{accessToken}"
    else
      callback err
