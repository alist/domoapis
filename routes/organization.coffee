organizationModel = require('../model/organization')
auth = require('../routes/auth') #middleware

exports.displayOrgs_get = (req) ->
  #auth omnipotent-one
  organizationModel.allOrganizations (orgs, err) =>
    if orgs?
      @send {organizations: orgs}
    else @send {err: "orgs fetch err: #{err}"}
 
exports.landing_get = (req) ->
  orgURL = @params.org
  if orgURL?
    organizationModel.organizationWithOrgURL orgURL, (org, err) =>
      if org?
        @render orglanding: {organization: org}
      else @next()
  else @next()

exports.adviceForm_get = (req) ->
  orgURL = @params.org
  if orgURL?
    organizationModel.organizationWithOrgURL orgURL, (org, err) =>
      if org?
        @render getadvice: {organization: org}
      else @redirect '/'
  else @redirect '/'
