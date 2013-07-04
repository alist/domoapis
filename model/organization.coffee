secrets = require ('../secrets')

mongoose = require('mongoose')
Schema = mongoose.Schema

ObjectId = mongoose.SchemaTypes.ObjectId

OrganizationSchema = new Schema {
  createdDate: {type: Date, index: {unique: false}}
  permissions: [{role: String, functionality:[String]}] #
  supportAreas: [{identifier: String, name: String}]
  escalationContact: {name: String, phone: String, email: String}
}

Organization = mongoose.model 'Organizations', OrganizationSchema
exports.Organization = Organization


exports.allOrganizations = (callback) -> #callback(organizations,error)
  Organization.find {}, {}, (orgs, err) ->
    callback orgs, err
