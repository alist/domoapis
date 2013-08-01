 var apiConfig = require("../config").config.api
  , OrganizationController = require('../controller/organization').OrganizationController
  
module.exports.public = function(app){
    console.log(apiConfig.path)
    app.get(apiConfig.path + '/organizations', OrganizationController.getAll.bind(OrganizationController));
}
