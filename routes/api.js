 var apiConfig = require("../configLoader").getConfig().app.api
  , OrganizationController = require('../controller/organization').OrganizationController
  
module.exports.public = function(app){
  app.get(apiConfig.path + '/organizations', OrganizationController.getAll.bind(OrganizationController));

  // TODO: make private
  app.get(apiConfig.path + '/organizations/:organization/users', OrganizationController.getUsersByOrgId.bind(OrganizationController));
  app.get(apiConfig.path + '/organizations/:organization/users/:userId', OrganizationController.getUser.bind(OrganizationController));
}
