secrets = require ('../secrets')

communicationsModel = require('./communications')

mongoose = require('mongoose')
Schema = mongoose.Schema

ObjectId = mongoose.SchemaTypes.ObjectId

AdviceSchema = new Schema {
  modifiedDate: {type: Date, index: {unique: false}},
  advice: {type: String},
  adviceContact: {type: String},
  adviceOn: {type: String, index: {unique: false}}
}

Advice = mongoose.model 'Advice', AdviceSchema
exports.Advice = Advice
  
mongoose.connect(secrets.mongoDBConnectURLSecret)

exports.addAdvice = (advice, adviceOn, adviceContact, userInfo, callback) -> #callback (err)
  if advice? == true && advice.length > 0
   advice = new Advice {modifiedDate: new Date(), advice: advice, adviceOn: adviceOn, adviceContact: adviceContact, userInfo: userInfo}
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
