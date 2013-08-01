var config = require('../config').config
    , _ = require('underscore')


module.exports.getDomainFromRequest = function(req) {
	return req.protocol + '://' + req.host  + ':' + config.env.port;
}


var statusCodes = module.exports.ResponseStatus = {
	REDIRECT: 302,
	FORBIDDEN: 403,
	BAD_REQUEST: 400,
	OK: 200
};


var ResponseHandler = function(req, res) {
	this.req = req;
	this.res = res;
	this.responseObj = {};
	this.responseType = null;

	this.view = null;
	this.resCode = null;
	this.redirectTo = null;
};


var buildResponse = function(resCode, metadata){
	var r = {};
	r.meta = metadata || {};
	r.meta.statusCode = resCode;
	r.meta.status = (resCode >= 400) ? 'error' : 'success';
	return r;
}


ResponseHandler.prototype.render = function(resCode, view, resData, metadata){

	if(!!this.responseType){
		throw new Error('Response already constructed');
	}

	this.responseType = 'render';

	var self = this;

	if(arguments.length === 2){
		// (view, resData)
		resData = view;
		view = resCode;
		resCode = statusCodes.OK;
	}

	if(!resData) {
		throw new Error('Required: resData');
	}

	this.view = view;
	this.setResponse(resCode, resData, metadata);

	return this;
}


ResponseHandler.prototype.redirect = function(resCode, path, resData, metadata){

	if(!!this.responseType){
		throw new Error('Response already constructed');
	}

	this.responseType = 'redirect';

	var self = this;

	if(arguments.length === 2){
		// (path, resData)
		resData = path;
		path = resCode;
		resCode = statusCodes.REDIRECT;
	} else if(arguments.length === 1){
		// (path)
		path = resCode;
		resCode = statusCodes.REDIRECT;
	}

	if(!path) {
		throw new Error('Invalid path: ' + path);
	}

	this.redirectTo = this.responseObj.redirectTo = path;
	this.setResponse(resCode, resData, metadata);
	
	return this;
}

ResponseHandler.prototype.setResponse = function(resCode, resData, metadata){
	this.resCode = resCode;
	this.responseObj = _.extend(this.responseObj, buildResponse(resCode, metadata));

	if(!!resData){
		this.data(resData);
		if(!!resData.errors && resData.errors.length) this.error(resData.errors);
	}
}

ResponseHandler.prototype.data = function(data){
	if(!data){
		return this;
	}
	this.responseObj.response = _.extend(this.responseObj.response || {}, data);
	return this;
}

ResponseHandler.prototype.error = function(err){
	if(!err){
		return this;
	}

	var errors = [];

	if(err instanceof Array) {
		errors = err;
	} else if(typeof err === 'string') {
		errors.push(err);
	} else if(typeof err === 'object') {
		errors.push(err.toString());
	}

	if(!this.responseObj.errors){
		this.responseObj.errors = errors;
	} else {
		this.responseObj.errors = _.union(this.responseObj.errors, errors);
	}

	return this;
}

ResponseHandler.prototype.done = function(){

	var self = this;


	if(this.responseObj.errors && this.responseObj.errors.length && this.responseObj.meta.status){
		this.responseObj.meta.status = 'error';
	}
	
	this.res.format({
	  'text/html': function(){

	  	if(!self.responseType){
	  		throw new Error('Response not constructed');
	  	}

	  	switch(self.responseType){
	  		case 'redirect':
	  			return self.res.redirect(self.redirectTo);
	  		break;

	  		case 'render':
					if(!!self.req.user)		self.res.locals.user = self.req.user;
			  	if(!!self.req.siteSection)		self.res.locals.siteSection = self.req.siteSection;

			    self.res.render(self.view, self.responseObj);
	  		break;
	  	}

	  },
	  
	  'application/json': function(){
	  		self.responseObj.response && delete self.responseObj.response.title;
	  		if(self.responseObj.meta.statusCode < 400)	self.responseObj.meta.statusCode = 200;
	    	self.res.json((self.resCode < 400) ? 200 : self.resCode, self.responseObj);
	  }
	});
}


module.exports.Response = function(req, res) {
	return new ResponseHandler(req, res);
}