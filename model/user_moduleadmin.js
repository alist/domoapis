var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = mongoose.Types.ObjectId

var moduleAdminSchema = new Schema({
  flag: { type: String, default: 'moduleadmin' },
});


moduleAdminSchema.statics.new = function(newAttrs, callback){
  var moduleAdmin = new ModuleAdmin();  
  moduleAdmin.save(function(err){
    if(err){
      return callback(err);
    }
    return callback(null, moduleAdmin);
  });
}

var ModuleAdmin = module.exports.ModuleAdmin = mongoose.model('moduleadmin', moduleAdminSchema, 'user_moduleadmin');