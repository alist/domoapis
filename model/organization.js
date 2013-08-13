var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , _ = require("lodash")
  
var orgSchema = new Schema({
  id:               { type: String, required: true, unique: true, index: true },
  displayName:      { type: String, required: true, index: true },
  orgURL:           { type: String, required: true, unique: true, index: true },
  code:             { type: String, required: true },
  bannerURL:        { type: String },
  city:             { type: String },
  region:           { type: String }
});

var schemaAttrs = _.keys(orgSchema.paths);


orgSchema.statics.getByOrgUrl = function(orgURL, callback) {
  this.findOne({ orgURL: orgURL }, callback);
}

orgSchema.statics.getById = function(id, callback) {
  this.findOne({ id: id }, callback);
}

orgSchema.statics.getByIdAndCode = function(id, code, callback) {
  this.findOne({ id: id, code: code }, callback);
}

orgSchema.statics.new = function(orgAttrs, callback){
  var org = new Organization();
  org = _.merge(org, _.pick(orgAttrs, schemaAttrs));
  org.save(function(err){
    if(err){
        return callback(err);
    } 
    return callback(null, org);
  });
}


var Organization = module.exports.Organization = mongoose.model('organization', orgSchema, 'organization');