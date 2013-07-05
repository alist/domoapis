secrets = require ('../secrets')

mongoose = require('mongoose')
Schema = mongoose.Schema

ObjectId = mongoose.SchemaTypes.ObjectId

OrganizationSchema = new Schema {
  orgURL: {type: String, index: {unique: true}}
  createdDate: {type: Date, index: {unique: false}}
  displayName: String
  permissions: [{role: String, functionality:[String]}]
  authCodes: [{code: String, validUntil: Date}]
  supportAreas: [{identifier: String, name: String}]
  usageDescription: String
  bannerURL: String
  escalationContact: {name: String, phone: String, email: String}
}

Organization = mongoose.model 'Organizations', OrganizationSchema
exports.Organization = Organization


exports.allOrganizations = (callback) -> #callback(organizations,error)
  Organization.find {}, {}, (err, orgs) =>
    callback orgs, err
 
exports.organizationWithOrgURL = (orgURL, callback) -> #callback(organization,error)
  Organization.findOne {orgURL : orgURL}, (err, org) =>
    callback org, err
