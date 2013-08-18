var OrganizationModel = require("../model/organization").Organization
  , OrgUser = require('../model/orguser')
  , OrgUserModel = OrgUser.OrgUser
  , Validator = require('validator').Validator
  , _ = require('lodash')
  , errors = require('../model/errors').errors
  , async = require('async')
  

var OrganizationController = function(){
};


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
    OrgUserModel.get(req.user._id, req.extras.organization._id, function(err, orguser) {
        if(err) {
            return res.ext.errorView('error.jade').error(err).render();
        }

        if(!orguser.accApproved) {
            return res.ext.view('supporterApprovalPending.jade').render();
        }

        return res.ext.view('giveadvice.jade').render();
    });
}
 
OrganizationController.prototype.getAdvice = function(req, res){
    return res.ext.view('getadvice.jade').render();
}
    
OrganizationController.prototype.getInfo = function(req, res){
    return res.ext.data({ organization: req.extras.organization }).view('orglanding').render();
}


OrganizationController.prototype.getUsersByOrgId = function(req, res){
    var response = res.ext.json();

    var isCollectionQuery = true;

    var query  = { orgId: req.extras.organization._id };
    if(!!req.params.userId) {
        query._id = req.params.userId;
        isCollectionQuery = false;
    }

    var popOpts = { path: '', select: '-__v -flag' };

    _.each(OrgUser.validRoles, function(role) {
        popOpts.path += 'roles.' +  role + ' ';
    });

    var orgusers = [];

    var stream = OrgUserModel
        .find(query)
        .select('email roles joined')
        .populate(popOpts)
        .lean()
        .stream()
        .on('data', function(orguser) {
            orgusers.push(orguser);
        })
        .on('error', function(err) {
            response.error(errors['ORG_NOT_FOUND'](err));
        })
        .on('close', function() {
            if(!orgusers.length) {
                return response.error(errors['ORG_NOT_FOUND'](err)).render();
            }
            if(isCollectionQuery) {
                return response.data({ users: orgusers }).render();
            }
            return response.data({ user: orgusers[0] }).render();
        });
}


    
OrganizationController.prototype.getByOrgUrl = function(orgUrl, callback){
    // lookup dbn
    OrganizationModel.getByOrgUrl(orgUrl, function(err, org){
        if(err){
            return callback(errors['ORG_NOT_FOUND'](err));
        }
        if(!org) {
            return callback(errors['ORG_NOT_FOUND']());
        }
        return callback(null, org);
    });
}


module.exports.OrganizationController = new OrganizationController();

