var OrganizationController = require('../controller/organization').OrganizationController
  , AdviceRequestController = require('../controller/advicerequest').AdviceRequestController
  , UserController = require('../controller/user').UserController


module.exports.private = function(app) {
  app.all('/:organization*', UserController.validateSession.bind(UserController));

  app.get('/:organization/giveadvice', OrganizationController.giveAdvice.bind(OrganizationController));
  
  /* //unfortunately this just doesn't trigger
  app.get('/:organization/giveadvice/', function(req, res, next) {
    console.log('whas realla?')    
    res.redirect('/:organization/giveadvice');
  });
  */

  app.get('/:organization/giveadvice/:advicerequestId', OrganizationController.giveAdviceDetail.bind(OrganizationController));

  app.get('/:organization/admin', OrganizationController.admin.bind(OrganizationController));

  //should be an api call, but these are cookie auth'd
  app.get('/:organization/advicerequest', AdviceRequestController.getAll.bind(AdviceRequestController));
  app.get('/:organization/advicerequest/:advicerequestId', AdviceRequestController.getAdvicerequestDetail.bind(AdviceRequestController));
  app.post('/:organization/advicerequest/:advicerequest/advice', AdviceRequestController.newAdvice.bind(AdviceRequestController));
  
}


module.exports.public = function(app) {
  app.get('/:organization/getadvice', OrganizationController.getAdvice.bind(OrganizationController));
  app.get('/:organization', OrganizationController.getInfo.bind(OrganizationController));
  app.get('/:organization/register', UserController.getRegister.bind(UserController));
  app.post('/:organization/register', UserController.register.bind(UserController));
};

