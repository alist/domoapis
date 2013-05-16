secrets = require ('../secrets')

communicationsModel = require('./communications')

mongoose = require('mongoose')
Schema = mongoose.Schema

ObjectId = mongoose.SchemaTypes.ObjectId

AdviceSchema = new Schema {
  modifiedDate: {type: Date, index: {unique: false}}
  adviceRequest: {type: String} #rename to request
  responses: []
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
        responseUpsert = {adviceResponse: adviceResponse, user: userInfoToStore, modifiedDate: new Date()}
        Advice.update {_id: objectIDWithID(adviceID)},{$set: {modifiedDate: new Date()}, $push: {responses: responseUpsert}}, {upsert: 0}, (err) =>
          console.log "updated advice: ", responseUpsert
          if err? == false
            console.log "saved advice response on id: #{adviceID}"
            communicationsModel.notifyAuthor 100000103231001, "new advice response at domo.io"
            callback err, responseUpsert
          else callback "error for advice save #{err}"
      else callback "no advice with adviceID #{adviceID}"
  else callback "no advice response given"
    

exports.addAdvice = (adviceRequest, adviceContact, userInfo, callback) -> #callback (err)
  if adviceRequest? == true && adviceRequest.length > 0
   accessToken = genCode 12, adviceContact
   authToken = genCode 4, adviceToken
   advice = new Advice {modifiedDate: new Date(), adviceRequest: adviceRequest, adviceContact: adviceContact, userInfo: userInfo, status: 'PAPP', authToken: authToken, accessToken: accessToken}
   advice.save (err) ->
    if err?
      callback "error for advice save #{err}"
    else
      communicationsModel.notifyAuthor 100000103231001, "new advice at domo.io"
      callback null
  else
    callback "no advice given"

exports.getAdviceSinceDate = (date, callback) ->
  Advice.find {modifiedDate : {$gt: date}}, {},{sort: { modifiedDate: -1 }}, (err, advice) =>
    callback err, advice


exports.getAdvice = (status, callback) ->
  Advice.find {}, {},{ sort: { modifiedDate: -1 }}, (err, advice) =>
    callback err, advice

objectIDWithID = (id) ->
  try
    objID = mongoose.mongo.BSONPure.ObjectID.fromString(id)
    return objID
  catch err
    console.log "not a objID #{id} err #{err}"
  return null
 
exports.approveAdviceRequest = (adviceID, callback) -> #callback(err)
  exports.getAdviceWithID adviceID, (err, advice) ->
    if advice?
      newStatus = "PRES"
      if advice.status == newStatus
        callback "advice for id #{adivceID} is already #{newStatus}"
      else
        advice.status = newStatus
        advice.save (err) =>
          callback err
    else callback "no advice for id #{adivceID}"
    

exports.getAdviceWithID = (adviceID, callback) -> #callback (err, advice)
  try
    objID = mongoose.mongo.BSONPure.ObjectID.fromString(adviceID)
  catch err
    console.log "not a objID #{adviceID}"
  Advice.findOne {_id : objID}, (err, advice) =>
    callback err, advice

exports.getAdviceWithToken = (token, callback) -> #callback (err, advice)
  Advice.findOne {accessToken : token}, (err, advice) =>
    callback err, advice


