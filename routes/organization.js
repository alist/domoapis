var OrganizationController = require('../controller/organization').OrganizationController
  , AdviceRequestController = require('../controller/advicerequest').AdviceRequestController
  , UserController = require('../controller/user').UserController


module.exports.private = function(app) {
  app.all('/:organization*', UserController.validateSession.bind(UserController));

  app.get('/:organization/giveadvice', OrganizationController.giveAdvice.bind(OrganizationController));
  
  app.get('/:organization/giveadvice/:advicerequestId', OrganizationController.giveAdviceDetail.bind(OrganizationController));

  app.get('/:organization/admin', OrganizationController.admin.bind(OrganizationController));

  //should be an api call
  app.get('/:organization/advicerequest', AdviceRequestController.getAll.bind(AdviceRequestController));
  app.get('/:organization/advicerequest/:advicerequestId', AdviceRequestController.getAdvicerequestDetail.bind(AdviceRequestController));
}


module.exports.public = function(app) {
  app.get('/:organization/getadvice', OrganizationController.getAdvice.bind(OrganizationController));
  app.get('/:organization', OrganizationController.getInfo.bind(OrganizationController));
  app.get('/:organization/register', UserController.getRegister.bind(UserController));
  app.post('/:organization/register', UserController.register.bind(UserController));
};

