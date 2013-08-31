
var OrganizationController = require('../controller/organization').OrganizationController
  , OrgUserController = require('../controller/orguser').OrgUserController
  , AdviceRequestController = require('../controller/advicerequest').AdviceRequestController
  , UserController = require('../controller/user').UserController
  , Config = require('../configLoader')
  , passport = require('passport')



module.exports.public = function(app) {
  var apiConfig = Config.getConfig().app.api;

  app.post(apiConfig.path + '/user/session', passport.authenticate('local', { session: false }), function(req, res) {
    res.ext.data({ token: req.extras.token }).render();
  });

  app.get(apiConfig.path + '/organizations', OrganizationController.getAll.bind(OrganizationController));
  app.get(apiConfig.path + '/organizations/:organization', OrganizationController.getInfo.bind(OrganizationController));

  // middleware protects codecheck and advicerequest routes
  app.all(apiConfig.path + '/organizations/:organization/:type(codecheck|advicerequest)/:advicerequest?', OrganizationController.validateCode.bind(OrganizationController));

  // all following routes require ?code=<code> to be correct
  app.get(apiConfig.path + '/organizations/:organization/codecheck', OrganizationController.codeCheck.bind(OrganizationController));
  app.get(apiConfig.path + '/organizations/:organization/advicerequest/:advicerequest', AdviceRequestController.getInfo.bind(AdviceRequestController));
  app.post(apiConfig.path + '/organizations/:organization/advicerequest', AdviceRequestController.newAdviceRequest.bind(AdviceRequestController));

}


module.exports.verif = function(app) {
  var apiConfig = Config.getConfig().app.api;

  app.all(apiConfig.path + '/organizations/:organization/*', UserController.validateToken.bind(UserController));
}


module.exports.private = function(app) {
  var apiConfig = Config.getConfig().app.api;

  app.get(apiConfig.path + '/organizations/:organization/advicerequest/:advicerequest/advice/:advice', AdviceRequestController.listAdvice.bind(AdviceRequestController));
  app.get(apiConfig.path + '/organizations/:organization/advicerequest/:advicerequest/advice', AdviceRequestController.listAdvice.bind(AdviceRequestController));
  app.post(apiConfig.path + '/organizations/:organization/advicerequest/:advicerequest/advice', AdviceRequestController.newAdvice.bind(AdviceRequestController));

  app.post(apiConfig.path + '/organizations/:organization/users/:userId/roles/:role', OrgUserController.addRole.bind(OrgUserController));
  app.delete(apiConfig.path + '/organizations/:organization/users/:userId/roles/:role', OrgUserController.deleteRole.bind(OrgUserController));

  app.get(apiConfig.path + '/organizations/:organization/users/:userId', OrgUserController.getUsersByOrgId.bind(OrgUserController));
  app.delete(apiConfig.path + '/organizations/:organization/users/:userId', OrgUserController.deleteUser.bind(OrgUserController));

  app.get(apiConfig.path + '/organizations/:organization/users', OrgUserController.getUsersByOrgId.bind(OrgUserController));

}
