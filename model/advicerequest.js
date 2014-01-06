var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , uuid = require('node-uuid')
  , errors = require('./errors').errors
  , _ = require('lodash')
  , moment = require('../modules/moment.min')

var OrgUserModel = require('./orguser').OrgUser

//var validSupportAreas = module.exports.validSupportAreas = [ 'career', 'mental-health' ];

var ResponseSchema = new Schema({
  // responseId: { type: String, required: true, unique: true, index: true }, // every subdoc will have an autogen _id. Use that
  //adviceId: { type: Schema.ObjectId, required: true, unique: true, index: true },
  adviceResponse: {type: String},
  adviceGiver: { type: Schema.Types.ObjectId, ref: 'orguser', required: true },
  adviceGiverDisplayName: {type: String},
  modifiedDate: {type: Date},
  helpful: {type: Boolean},
  createdOn: {type: Date},
  status: {type: String},
  thankyou: {type: Boolean}
});

var adviceRequestSchema = new Schema({
  // id:  { type: String, required: true, unique: true, index: true }, // Use _id
  organization: { type: Schema.Types.ObjectId, ref: 'organization', required: true },
  accessURL: {type: String},
  accessToken: {type: String, index: {unique: true}},
  telephoneNumber: {type: String, index: {unique: false}},
  reqstatus: {type: String},

  createdOn: {type: Date, default: Date.now},
  lastNotificationDate: {type: Date, index: {unique: false}},
  notificationInterval: {type: Number},
  supportAreaIdentifier: {type: String, required: false}, //, enum: validSupportAreas },
  adviceRequest: {type: String, required: true},
  subscriberId: { type: String },
  lastResponseDate: {type: Date},
  assignedSupporters : [ {type: Schema.Types.ObjectId, ref: 'orguser'} ],
  assignedSupportersCount : {type: Number, default : 0},
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

adviceRequestSchema.statics.findAll = function(callback) { //(err,adviceRequests)
  this.find().sort({'createdOn': -1}).execFind(function(err, adviceRequests) {
      if(!adviceRequests) {
          return callback(errors['ADVICEREQUEST_NOT_FOUND']());
      }
      return callback(err, adviceRequests);
  });
}

adviceRequestSchema.statics.findAllByOrg = function(orgId, callback) { //(err,adviceRequests)
  this.find( { organization: orgId } ).sort({'createdOn': -1}).execFind(function(err, adviceRequests) {
      if(!adviceRequests) {
          return callback(errors['ADVICEREQUEST_NOT_FOUND']());
      }
      return callback(err, adviceRequests);
  });
}

adviceRequestSchema.statics.new = function(adviceRequestAttrs, callback){
  var adviceRequest = new AdviceRequest();
  adviceRequest = _.merge(adviceRequest, _.pick(adviceRequestAttrs, [ 'organization', 'telephoneNumber', 'supportAreaIdentifier', 'adviceRequest', 'reqstatus' ]));
  adviceRequest.accessToken = uuid.v4().replace(/\-/g, '');

  if(!!adviceRequestAttrs.subscriberId) {
    adviceRequest.subscriberId = adviceRequestAttrs.subscriberId;
  }

  // adviceRequest.accessURL = shorturl-code
  adviceRequest.save(function(err){
    if(err){
        return callback(err);
    }
    return callback(null, adviceRequest);
  });
};


adviceRequestSchema.statics.newAdvice = function(req,advicerequestId, supporterId, newAdviceAttrs, callback){

  if (!newAdviceAttrs.advice){
    console.log('no advice received');
    return callback("no advice provided");
  }
  else{
    console.log('in the new Advice controller with a new advice passed in');
    console.log(newAdviceAttrs.advice);
  }

  var newAdviceUpdate = {
    adviceResponse: newAdviceAttrs.advice,
    adviceGiver: supporterId,
    adviceGiverDisplayName: newAdviceAttrs.adviceGiverDisplayName,
    modifiedDate: new Date(),
    createdOn: new Date(),
    helpful: newAdviceAttrs.helpful,
    status: 'Created',
    thankyou: newAdviceAttrs.thankyou
  };

  var updates = {
    $push: {
      responses: newAdviceUpdate
    },
    $set: {
      lastResponseDate: new Date() 
    }
  };

  AdviceRequest.findOneAndUpdate({ _id: advicerequestId }, updates, { upsert: true }, function(err, AdviceRequest) {
    if (!AdviceRequest) {
      console.log("Lookup for advice request " + advicerequestId + " failed w. error " + err);
      return callback("no advice request found");
    } else {
      console.log('find was successful');
      return callback(err, AdviceRequest, newAdviceUpdate);
    }
  });
};


adviceRequestSchema.statics.setAdviceHelpful = function(advicerequestId, adviceId, accessToken, newAdviceAttrs, callback){

  if (!newAdviceAttrs.helpful){
    console.log('no advice helpful update received');
    return callback("no advice helpful update provided");
  }
  else{
    console.log('in the Advice model for advice helpful update with an advice passed in');
    console.log(advicerequestId);
    console.log(adviceId);
    console.log(accessToken);
    console.log(newAdviceAttrs.helpful);
  }

//arrayname.$.fieldname
  var updates = {
    $set: {
      "responses.$.modifiedDate": new Date(),
      "responses.$.helpful": newAdviceAttrs.helpful,
      "responses.$.status": 'Helpful set'
    }
  };

  AdviceRequest.findOneAndUpdate({ "_id": advicerequestId, "accessToken": accessToken, "responses._id": adviceId }, updates, function(err, AdviceRequest) {
    if (!AdviceRequest) {
      console.log("Lookup for advice request " + advicerequestId + " failed w. error " + err);
      return callback("no advice request found");
    } else {
      console.log('find was successful. Should have updated helpful flag');
      return callback(err, AdviceRequest);
    }
  });
};


adviceRequestSchema.statics.setAdviceThankyou = function(advicerequestId, adviceId, accessToken, newAdviceAttrs, callback){

  if (!newAdviceAttrs.thankyou){
    console.log('no advice thank you update received');
    return callback("no advice thank you update provided");
  }
  else{
    console.log('in the new Advice controller for advice thank you update with a new advice passed in');
    console.log(advicerequestId);
    console.log(adviceId);
    console.log(accessToken);
    console.log(newAdviceAttrs.helpful);
  }

//arrayname.$.fieldname
  var updates = {
    $set: {
      "responses.$.modifiedDate": new Date(),
      "responses.$.thankyou": newAdviceAttrs.thankyou,
      "responses.$.status": 'Thankyou set'
    }
  };

  AdviceRequest.findOneAndUpdate({ "_id": advicerequestId, accessToken: accessToken, "responses._id": adviceId }, updates, function(err, AdviceRequest) {
    if (!AdviceRequest) {
      console.log("Lookup for advice request " + advicerequestId + " failed w. error " + err);
      return callback("no advice request found");
    } else {
      console.log('find was successful. Should have updated thankyou flag');
      return callback(err, AdviceRequest);
    }
  });
};


var AdviceRequest = module.exports.AdviceRequest = mongoose.model('advicerequest', adviceRequestSchema, 'advicerequest');