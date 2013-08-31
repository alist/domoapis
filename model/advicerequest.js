var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , uuid = require('node-uuid')
  , errors = require('./errors').errors
  , _ = require('lodash')

var validSupportAreas = module.exports.validSupportAreas = [ 'career', 'mental-health' ];

var ResponseSchema = new Schema({
  // responseId: { type: String, required: true, unique: true, index: true }, // every subdoc will have an autogen _id. Use that
  //adviceId: { type: Schema.ObjectId, required: true, unique: true, index: true },
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
  supportArea: { type: String, enum: validSupportAreas },
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
  adviceRequest = _.merge(adviceRequest, _.pick(adviceRequestAttrs, [ 'organization', 'telephoneNumber', 'supportArea', 'adviceRequest' ]));
  adviceRequest.accessToken = uuid.v4().replace(/\-/g, '');
  // adviceRequest.accessURL = shorturl-code
  adviceRequest.save(function(err){
    if(err){
        return callback(err);
    }
    return callback(null, adviceRequest);
  });
};


adviceRequestSchema.statics.newAdvice = function(advicerequestId, supporter, newAdviceAttrs, callback){
  
  if (!newAdviceAttrs.advice){
    console.log('no advice received');
    return callback("no advice provided");
  }
  else{
    console.log('in the new Advice controller with a new advice passed in');
    console.log(newAdviceAttrs.advice);
  }
  
  
  var updates = {
    $push: {
      redirects: {
          adviceResponse: newAdviceAttrs.advice,
          adviceGiver: supporter,
          modifiedDate: new Date(),
          helpful: newAdviceAttrs.helpful,
          status: 'Created',
          thankyou: newAdviceAttrs.thankyou
      }
    },
    //$inc: {
    //  redirectCount: 1
    //},
    //$set: {
      //modifiedDate: new Date()
    //}
  };  
  
  AdviceRequest.findOneAndUpdate({ _id: advicerequestId }, updates, function(err, AdviceRequest) {
    if (!AdviceRequest) {
      console.log("Lookup for advice request " + advicerequestId + " failed w. error " + err);
      return callback("no advice request found");
    } else {
      console.log('find was successful');
      return AdviceRequest;
      //return callback(err, AdviceRequest);
    }
  });  
  //return callback (null, AdviceRequest);
};


var AdviceRequest = module.exports.AdviceRequest = mongoose.model('advicerequest', adviceRequestSchema, 'advicerequest');