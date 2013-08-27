var AdviceRequestModel = require("../model/advicerequest").AdviceRequest
  , Organization = require('../controller/organization').OrganizationController
  , Validator = require('validator').Validator
  , _ = require('lodash')
  , errors = require('../model/errors').errors
  , async = require('async')


var AdviceRequestController = function(){
};

AdviceRequestController.prototype.newAdviceRequest = function(req, res) {

  var newAdviceRequestAttrs = req.body;
  // TODO: Add validations here

  newAdviceRequestAttrs.organization = req.extras.organization._id;

  AdviceRequestModel.new(newAdviceRequestAttrs, function(err, advicerequest) {
    if(err) {
      return res.ext.error(err).render();
    }

    return res.ext.data({ advicerequest: advicerequest.toObject() }).render();
  });
}

module.exports.AdviceRequestController = new AdviceRequestController();