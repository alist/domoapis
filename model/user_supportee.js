var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = mongoose.Types.ObjectId

var supporteeSchema = new Schema({
  flag: { type: String, default: 'supportee' },
});


supporteeSchema.statics.new = function(newAttrs, callback){
  var supportee = new Supportee();
  supportee.save(function(err){
    if(err){
      return callback(err);
    }
    return callback(null, supportee);
  });
}

var Supportee = module.exports.Supportee = mongoose.model('supportee', supporteeSchema, 'user_supportee');