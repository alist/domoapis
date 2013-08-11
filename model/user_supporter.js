var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = mongoose.Types.ObjectId
  , _ = require('lodash')


var validSupportAreas = module.exports.validSupportAreas = [ 'career', 'mental-health' ];

var supporterSchema = new Schema({
  supportAreas:                       [ { type: String, enum: validSupportAreas } ],
  joined:                             { type: Date, default: Date.now },
  skills:                             { type: String },
  // Following attribs belong in a message dispatch collection and not here
  messageCount:                       { type: Number },       //how many msgs they've received
  overIntervalMessageAllowanceCount:  { type: Number },       //how many msgs allowed to be sent past the notification interval
  lastNotificationDate:               { type: Date, index: { unique: false } },
  notificationInterval:               { type: Number }
});

var schemaAttrs = _.keys(supporterSchema.paths);

supporterSchema.statics.new = function(newAttrs, callback){
  var supporter = new Supporter();
  // TODO: needs validation in the controller and add validation rules to the schema
  supporter = _.merge(supporter, _.pick(newAttrs, schemaAttrs));
  supporter.save(function(err){
    if(err){
      return callback(err);
    }
    return callback(null, supporter);
  });
}

var Supporter = module.exports.Supporter = mongoose.model('supporter', supporterSchema, 'user_supporter');