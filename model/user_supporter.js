var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = mongoose.Types.ObjectId

var supporterSchema = new Schema({
  flag: { type: String, default: 'supporter' },
});


supporterSchema.statics.new = function(newAttrs, callback){
  var supporter = new Supporter();
  supporter.save(function(err){
    if(err){
      return callback(err);
    }
    return callback(null, supporter);
  });
}

var Supporter = module.exports.Supporter = mongoose.model('supporter', supporterSchema, 'user_supporter');