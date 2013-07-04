organizationModel = require('../model/organization')
auth = require('../routes/auth') #middleware

exports.displayOrgs_get = (req, res) ->
  
  organizationModel.allOrganizations (orgs, err) =>
    if orgs?
      @send {organizations: orgs}
    else @send {err: "orgs fetch err: #{err}"}
 