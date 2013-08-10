var OrganizationModel = require("../model/organization").Organization
  , Validator = require('validator').Validator
  , _ = require('lodash')
  

var OrganizationController = function(){
};


OrganizationController.prototype.login = function(req, res){
    var response = res.ext;

    if(req.isAuthenticated()){
      return response.redirect('/' + req.extras.organization.orgURL);
    }

    response.view('orglogin.jade').errorView('error.jade');

    var data = {
        title: "Login",
        username: ""
    };

    var errors = req.flash("error");
    if(!!errors){
        response.locals({ errors: errors });
    }

    var redirTo = req.flash("redirTo");
    if(!!redirTo){
        data.redirTo = redirTo;
    }

    return response.data(data).render();
}

OrganizationController.prototype.auth = function(req, res){

}

OrganizationController.prototype.getAll = function(req, res){
    var response = res.ext;
    response.view('data.jade').errorView('error.jade');

    var isTypeahead = (!!req.query.src && req.query.src === 'typeahead');

    var lookup = {};
    if(!!req.query.q) {
        // TODO: [SECURITY] sanitize req.query.src
        lookup.displayName = new RegExp(req.query.q, 'i');
    }

    OrganizationModel.find(lookup, { displayName: 1 }).select('id displayName').sort({ displayName: 'asc' }).limit(15).exec(function(err, orgs) {
        if(err) {
            if(isTypeahead) {
                return res.json([]);
            }
            return response.error(err).render();
        }
        orgs = orgs || [];

        if(isTypeahead) {
            return res.json(orgs);
        }

        return response.data({ organizations: orgs }).json().render();
    });
}

OrganizationController.prototype.giveAdvice = function(req, res){
    return res.ext.view('giveadvice.jade').render();
}
 
OrganizationController.prototype.getAdvice = function(req, res){
    return res.ext.view('getadvice.jade').render();
}
    
OrganizationController.prototype.getInfo = function(req, res){
    return res.ext.view('orglanding').render(); 
}

    
OrganizationController.prototype.getByOrgUrl = function(orgUrl, callback){
    // lookup dbn
    OrganizationModel.getByOrgUrl(orgUrl, function(err, org){
        if(err){
            return callback(new Error('ORG_NOT_FOUND'));
        }
        return callback(null, org);
    });
}

module.exports.OrganizationController = new OrganizationController();

