 var apiConfig = require("../configLoader").getConfig().app.api
  , OrganizationController = require('../controller/organization').OrganizationController
  
module.exports.public = function(app){
    app.get(apiConfig.path + '/organizations', OrganizationController.getAll.bind(OrganizationController));
}
