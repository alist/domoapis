var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = mongoose.Types.ObjectId
  , _ = require('lodash')


var moduleAdminSchema = new Schema({
  flag: { type: String, default: 'moduleadmin' },
});

var schemaAttrs = _.keys(moduleAdminSchema.paths);

moduleAdminSchema.statics.new = function(newAttrs, callback){
  var moduleAdmin = new ModuleAdmin();
  // TODO: needs validation in the controller and add validation rules to the schema
  moduleAdmin = _.merge(moduleAdmin, _.pick(newAttrs, schemaAttrs));
  moduleAdmin.save(function(err){
    if(err){
      return callback(err);
    }
    return callback(null, moduleAdmin);
  });
}

var ModuleAdmin = module.exports.ModuleAdmin = mongoose.model('moduleadmin', moduleAdminSchema, 'user_moduleadmin');