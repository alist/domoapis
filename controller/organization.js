 var Utils = require('../lib/utils')
   , Response = Utils.Response
   , ResponseStatus = Utils.ResponseStatus
   , OrganizationModel = require("../model/organization").Organization
  
var OrganizationController = function(){
};

var fnError = function(response, errors){
    if(!!errors)  response.error(errors);
    return response.render(
          ResponseStatus.BAD_REQUEST,
          'error.jade',
          _.extend(
            {},
            { title: 'Error' }
          )
    );
}

OrganizationController.prototype.login = function(req, res){
    var response = Response(req, res);

    if(req.isAuthenticated()){
      return Response(req, res).redirect('/' + req.extras.organization.orgURL).done();
    }

    response.render('orglogin.jade', {});

    var data = {
        title: "Login",
        username: ""
    };

    var error = req.flash("error");
    if(!!error){
        response.error(error);
    }

    var redirTo = req.flash("redirTo");
    if(!!redirTo){
        data.redirTo = redirTo;
    }

    return response.data(data).done();
}

OrganizationController.prototype.auth = function(req, res){

}

OrganizationController.prototype.getAll = function(req, res){
    var response = Response(req, res);
    
    OrganizationModel.getAll(function(err, orgs){
        if(err){
            return fnError(response).done();
        }
        orgs = orgs || [];
        return response.render('data.jade', {}).data({ organizations: orgs }).done();
    });
}

OrganizationController.prototype.giveAdvice = function(req, res){
    return Response(req, res).render('giveadvice.jade', {}).done();
}
 
OrganizationController.prototype.getAdvice = function(req, res){
    return Response(req, res).render('getadvice.jade', {}).done();
}
    
OrganizationController.prototype.getInfo = function(req, res){
    return Response(req, res).render('orglanding', {}).done(); 
}

    
OrganizationController.prototype.getByOrgUrl = function(orgUrl, callback){
    // lookup dbn
    OrganizationModel.findByOrgUrl(orgUrl, function(err, org){
        if(err){
            return callback(new Error('ORG_NOT_FOUND'));
        }
        return callback(null, org);
    });
}

module.exports.OrganizationController = new OrganizationController();

