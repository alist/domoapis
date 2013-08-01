var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , _ = require("underscore")
  
 var orgSchema = new Schema({
      id:               { type: String, required: true, unique: true, index: true },
      displayName:      { type: String, required: true, index: true },
      orgURL:           { type: String, required: true, unique: true, index: true },
      bannerURL:        { type: String },
      city:             { type: String },
      region:           { type: String }
 });
 
 orgSchema.statics.getAll = function(callback){
     this.find({}).sort({ displayName: 'asc' }).exec(callback);
 }
 
  orgSchema.statics.findByOrgUrl = function(orgURL, callback) {
     this.findOne({ orgURL: orgURL }, callback);
 }
 
 orgSchema.statics.findById = function(orgId, callback) {
     this.findOne({ id: orgId }, callback);
 }
 
 orgSchema.statics.newOrganization = function(orgAttrs, callback){
     var org = new Organization();
     _.each([ 'id', 'displayName', 'orgURL', 'bannerURL', 'city', 'region' ], function(k){
         if(!!orgAttrs[k]){
            org[k] = orgAttrs[k];
         }
     });
     org.save(function(err){
        if(err){
            return callback(err);
        } 
        return callback(null, org);
     });
 }
 
 
 var Organization = module.exports.Organization = mongoose.model('organization', orgSchema, 'organization');