var OrganizationController = require('../controller/organization').OrganizationController
  , OrgUserController = require('../controller/orguser').OrgUserController
  , AdviceRequestController = require('../controller/advicerequest').AdviceRequestController



module.exports.public = function(app){
  var apiConfig = require("../configLoader").getConfig().app.api

  app.get(apiConfig.path + '/organizations', OrganizationController.getAll.bind(OrganizationController));

  // TODO: make private

  app.post(apiConfig.path + '/organizations/:organization/users/:userId/roles/:role', OrgUserController.addRole.bind(OrgUserController));
  app.delete(apiConfig.path + '/organizations/:organization/users/:userId/roles/:role', OrgUserController.deleteRole.bind(OrgUserController));

  app.get(apiConfig.path + '/organizations/:organization/users/:userId', OrgUserController.getUsersByOrgId.bind(OrgUserController));
  app.delete(apiConfig.path + '/organizations/:organization/users/:userId', OrgUserController.deleteUser.bind(OrgUserController));

  app.get(apiConfig.path + '/organizations/:organization', OrganizationController.getInfo.bind(OrganizationController));
  app.get(apiConfig.path + '/organizations/:organization/users', OrgUserController.getUsersByOrgId.bind(OrgUserController));

  // middleware protects all routes below it
  app.all(apiConfig.path + '/organizations/:organization/*', OrganizationController.validateCode.bind(OrganizationController));

  // all following routes require ?code=<code> to be correct
  app.get(apiConfig.path + '/organizations/:organization/codecheck', OrganizationController.codeCheck.bind(OrganizationController));
  app.post(apiConfig.path + '/organizations/:organization/advicerequest', AdviceRequestController.newAdviceRequest.bind(AdviceRequestController));
  app.get(apiConfig.path + '/organizations/:organization/advicerequest/:advicerequest', AdviceRequestController.getInfo.bind(AdviceRequestController));

}
