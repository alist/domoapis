var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = mongoose.Types.ObjectId
  , _ = require('lodash')


var supporteeSchema = new Schema({
  flag: { type: String, default: 'supportee' },
});

var schemaAttrs = _.keys(supporteeSchema.paths);


supporteeSchema.statics.new = function(newAttrs, callback){
  var supportee = new Supportee();
  // TODO: needs validation in the controller and add validation rules to the schema
  supportee = _.merge(supportee, _.pick(newAttrs, schemaAttrs));
  supportee.save(function(err){
    if(err){
      return callback(err);
    }
    return callback(null, supportee);
  });
}

var Supportee = module.exports.Supportee = mongoose.model('supportee', supporteeSchema, 'user_supportee');