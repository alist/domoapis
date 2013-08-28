var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , uuid = require('node-uuid')
  , errors = require('./errors').errors
  , _ = require('lodash')


var ResponseSchema = new Schema({
  // responseId: { type: String, required: true, unique: true, index: true }, // every subdoc will have an autogen _id. Use that
  adviceResponse: {type: String},
  adviceGiver: { type: Schema.Types.ObjectId, ref: 'orguser', required: true },
  modifiedDate: {type: Date},
  helpful: {type: Number},
  status: {type: String},
  thankyou: {type: Number}
});

var adviceRequestSchema = new Schema({
  // id:  { type: String, required: true, unique: true, index: true }, // Use _id
  organization: { type: Schema.Types.ObjectId, ref: 'organization', required: true },
  accessURL: {type: String},
  accessToken: {type: String, index: {unique: true}},
  telephoneNumber: {type: String, index: {unique: false}},
  //telephoneVerifyDate: {type: Date},
  //telephoneNumberVerifyAttemptCount: {type: Number},
  //telelphoneVerifyCode: {type: String},
  //messageCount: {type: Number}, //how many msgs they've received
  //overIntervalMessageAllowanceCount: {type: Number}, //how many msgs allowed to be sent past the notification interval
  createdOn: {type: Date, default: Date.now},
  lastNotificationDate: {type: Date, index: {unique: false}},
  notificationInterval: {type: Number},
  //authToken: {type: String},
  adviceRequest: {type: String, required: true},
  responses: [ResponseSchema]
});



adviceRequestSchema.statics.getByAccessURL = function(accessURL, callback) {
  this.findOne({ accessURL: accessURL }, function(err, adviceRequest) {
      if(!adviceRequest) {
          return callback(errors['ADVICEREQUEST_NOT_FOUND']());
      }
      return callback(err, adviceRequest);
  });
}

adviceRequestSchema.statics.new = function(adviceRequestAttrs, callback){
  var adviceRequest = new AdviceRequest();
  adviceRequest = _.merge(adviceRequest, _.pick(adviceRequestAttrs, [ 'organization', 'telephoneNumber', 'adviceRequest' ]));
  adviceRequest.accessToken = uuid.v4().replace(/\-/g, '');
  // adviceRequest.accessURL = shorturl-code
  adviceRequest.save(function(err){
    if(err){
        return callback(err);
    }
    return callback(null, adviceRequest);
  });
}


var AdviceRequest = module.exports.AdviceRequest = mongoose.model('advicerequest', adviceRequestSchema, 'advicerequest');