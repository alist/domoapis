var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = mongoose.Types.ObjectId
  , _ = require('lodash')


var adopterSchema = new Schema({
  flag: { type: String, default: 'adopter' },
});

var schemaAttrs = _.keys(adopterSchema.paths);


adopterSchema.statics.new = function(newAttrs, callback){
  var adopter = new Adopter();
  // TODO: needs validation in the controller and add validation rules to the schema
  adopter = _.merge(adopter, _.pick(newAttrs, schemaAttrs));
  adopter.save(function(err){
    if(err){
      return callback(err);
    }
    return callback(null, adopter);
  });
}

var Adopter = module.exports.adopter = mongoose.model('adopter', adopterSchema, 'user_adopter');