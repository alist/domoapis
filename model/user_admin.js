var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = mongoose.Types.ObjectId
  , _ = require('lodash')


var adminSchema = new Schema({
  flag: { type: String, default: 'admin' },
});

var schemaAttrs = _.keys(adminSchema.paths);


adminSchema.statics.new = function(newAttrs, callback){
  var admin = new Admin();
  // TODO: needs validation in the controller and add validation rules to the schema
  admin = _.merge(admin, _.pick(newAttrs, schemaAttrs));
  admin.save(function(err){
    if(err){
      return callback(err);
    }
    return callback(null, admin);
  });
}

var Admin = module.exports.admin = mongoose.model('admin', adminSchema, 'user_admin');