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
}

Advice = mongoose.model 'Advice', AdviceSchema
exports.Advice = Advice
  
mongoose.connect(secrets.mongoDBConnectURLSecret)

exports.addResponse = (adviceID, adviceResponse, userInfoToStore, callback) -> #callback (err)
  if adviceResponse? == true && adviceResponse.length > 0
    exports.getAdviceWithID adviceID, (err, advice) =>
      if advice?
        responseUpsert = {adviceResponse: adviceResponse, user: userInfoToStore, modifiedDate: new Date()}
        Advice.update {id: advice._id},{responses: {$push: responseUpsert}}, null, (err) =>
          console.log "upserted advice: ", responseUpsert
          if err? == false
            console.log "saved advice response! #{advice}"
            communicationsModel.notifyAuthor 100000103231001, "new advice response at domo.io"
            exports.getAdviceWithID adviceID, (err, updatedAdvice) =>
              callback err, updatedAdvice, responseUpsert
          else callback "error for advice save #{err}"
      else callback "no advice with adviceID #{adviceID}"
  else callback "no advice response given"
    

exports.addAdvice = (adviceRequest, adviceContact, userInfo, callback) -> #callback (err)
  if adviceRequest? == true && adviceRequest.length > 0
   advice = new Advice {modifiedDate: new Date(), adviceRequest: adviceRequest, adviceContact: adviceContact, userInfo: userInfo}
   advice.save (err) ->
    if err?
      callback "error for advice save #{err}"
    else
      console.log "saved advice! #{advice}"
      communicationsModel.notifyAuthor 100000103231001, "new advice at domo.io"
      callback null
  else
    callback "no advice given"

exports.getAdviceSinceDate = (date, callback) ->
  Advice.find {modifiedDate : {$gt: date}}, {}, (err, advice) =>
    callback err, advice


exports.getAdvice = (status, callback) ->
  Advice.find {}, {}, (err, advice) =>
    callback err, advice

exports.getAdviceWithID = (adviceID, callback) -> #callback (err, advice)
  try
    objID = mongoose.mongo.BSONPure.ObjectID.fromString(adviceID)
  catch err
    console.log "not a objID #{adviceID}"
  Advice.findOne {_id : objID}, (err, advice) =>
    callback err, advice
