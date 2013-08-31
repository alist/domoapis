var OrganizationController = require('../controller/organization').OrganizationController
  , UserController = require('../controller/user').UserController


module.exports.private = function(app) {
  app.all('/:organization*', UserController.validateSession.bind(UserController));

  app.get('/:organization/giveadvice', OrganizationController.giveAdvice.bind(OrganizationController));

  app.get('/:organization/admin', OrganizationController.admin.bind(OrganizationController));
}


module.exports.public = function(app) {
  app.get('/:organization/getadvice', OrganizationController.getAdvice.bind(OrganizationController));
  app.get('/:organization', OrganizationController.getInfo.bind(OrganizationController));
  app.get('/:organization/register', UserController.getRegister.bind(UserController));
  app.post('/:organization/register', UserController.register.bind(UserController));
};

