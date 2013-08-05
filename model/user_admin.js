var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = mongoose.Types.ObjectId

var adminSchema = new Schema({
  flag: { type: String, default: 'admin' },
});


adminSchema.statics.new = function(newAttrs, callback){
  var admin = new Admin();
  admin.save(function(err){
    if(err){
      return callback(err);
    }
    return callback(null, admin);
  });
}

var Admin = module.exports.admin = mongoose.model('admin', adminSchema, 'user_admin');