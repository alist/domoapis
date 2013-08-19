 var apiConfig = require("../configLoader").getConfig().app.api
  , OrganizationController = require('../controller/organization').OrganizationController
  , OrgUserController = require('../controller/orguser').OrgUserController
  
module.exports.public = function(app){
  app.get(apiConfig.path + '/organizations', OrganizationController.getAll.bind(OrganizationController));

  // TODO: make private

  app.post(apiConfig.path + '/organizations/:organization/users/:userId/roles/:role', OrgUserController.addRole.bind(OrgUserController));
  app.delete(apiConfig.path + '/organizations/:organization/users/:userId/roles/:role', OrgUserController.deleteRole.bind(OrgUserController));

  app.get(apiConfig.path + '/organizations/:organization/users/:userId', OrgUserController.getUsersByOrgId.bind(OrgUserController));
  app.delete(apiConfig.path + '/organizations/:organization/users/:userId', OrgUserController.deleteUser.bind(OrgUserController));

  app.get(apiConfig.path + '/organizations/:organization', OrganizationController.getInfo.bind(OrganizationController));
  app.get(apiConfig.path + '/organizations/:organization/users', OrgUserController.getUsersByOrgId.bind(OrgUserController));
}
