var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = mongoose.Types.ObjectId

var adopterSchema = new Schema({
  flag: { type: String, default: 'adopter' },
});


adopterSchema.statics.new = function(newAttrs, callback){

  // setTimeout(function(){
  //   return callback(new Error('doh'));
  // }, 500);
  
  var adopter = new Adopter();
  adopter.save(function(err){
    if(err){
      return callback(err);
    }
    return callback(null, adopter);
  });
}

var Adopter = module.exports.adopter = mongoose.model('adopter', adopterSchema, 'user_adopter');