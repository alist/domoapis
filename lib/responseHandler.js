
var utils = require('./utils')
  , _ = require('lodash')


var statusCodes = module.exports.StatusCodes = {
  REDIRECT: 302,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  BAD_REQUEST: 400,
  SERVER_ERROR: 500,
  SUCCESS: 200,
  CREATED: 201
};


 var DEFAULT_SUCCESS_CODE = 200
   , DEFAULT_ERROR_CODE = 400; 



function mergeData(store, data) {
  if (!_.isObject(data)) {
    return store;
  }
  store = _.merge(store || {}, data);
  return store;
}



function apiResponse(resHandler, debug) {
  var responseObj = {
    meta: resHandler.meta,
    response: resHandler.resData || {}
  };

  if (_.isArray(resHandler.errors)) {
    responseObj.errors = resHandler.errors;
  }

  resHandler.res.json(resHandler.meta.statusCode, responseObj);

  if (debug) {
    console.log('----');
    utils.print('req.method', resHandler.req.method);
    utils.print('req.path', resHandler.req.path);
    utils.print('response.body', responseObj);
    console.log('----');
  }  
}



function htmlResponse(resHandler, debug) {
  if(_.isString(resHandler.redirectPath)) {
    return resHandler.res.redirect(resHandler.redirectPath);
  }

  var res = resHandler.res;

  // Setup res.locals
  if(_.isObject(resHandler.resLocals)){
    res.locals = mergeData(res.locals, resHandler.resLocals);
  }

  var viewData = mergeData(resHandler.resData, resHandler.resViewData);

  var hasErrors = _.isArray(resHandler.errors) && (resHandler.errors.length > 0);
  if (hasErrors) {
    viewData.errors = resHandler.errors;
  }

  res.status(resHandler.meta.statusCode);
  var view = (hasErrors && _.isString(resHandler.resErrView)) ? resHandler.resErrView : resHandler.resView;
  res.render(view, viewData);

  if (debug) {
    console.log('----');
    utils.print('req.method', resHandler.req.method);
    utils.print('req.path', resHandler.req.path);
    utils.print('meta', resHandler.meta);
    utils.print('view', view);
    utils.print('viewData', viewData);
    utils.print('res.locals', resHandler.res.locals);
    console.log('----');
  }
}




var ResponseHandler = function(req, res) {

  this.STATUS = statusCodes;

  this.req = req;
  this.res = res;

  this.meta = null;
  
  this.resView = null;
  this.resErrView = null;

  this.resData = null;
  this.resLocals = null;
  this.resViewData = null;
  this.errors = null;

  this.redirectPath = null;

  this.forceJson = false;
  this.enableDebug = false;

};


// http status code for response
ResponseHandler.prototype.code = function(statusCode) {
  if (!_.isNumber(statusCode) || statusCode < 200 || statusCode > 599) {
    throw new Error('Non-numeric or invalid status code');
    return this;
  }

  this.meta = this.meta || {};
  this.meta.statusCode = statusCode;
  this.meta.status = (statusCode >= 400) ? 'error' : 'success';
  return this;
}

// view to be used for errors
ResponseHandler.prototype.errorView = function(view) {
  if (!_.isString(view)) {
    throw new Error('No errorView specified');
  }
  this.resErrView = view;
  return this;
}

// view to be used for success
ResponseHandler.prototype.view = function(view) {
  if (!_.isString(view)) {
    throw new Error('No view specified');
    return this;
  }
  this.resView = view;
  return this;
}

// output: json, even if client requested html
ResponseHandler.prototype.json = function(val) {
  this.forceJson = _.isBoolean(val) ? val : true;
  return this;
}

// res.locals.*
ResponseHandler.prototype.locals = function(data) {
  this.resLocals = mergeData(this.resLocals, data);
  return this;
}

// res.render('view', *) and res.json(*)
ResponseHandler.prototype.data = function(data, addToLocals) {
  this.resData = mergeData(this.resData, data);
  if (addToLocals) {
    this.locals(data);
  }
  return this;
}

// res.render('view', *)
ResponseHandler.prototype.viewData = function(data, addToLocals) {
  this.resViewData = mergeData(this.resViewData, data);
  if (addToLocals) {
    this.locals(data);
  }
  return this;
}


ResponseHandler.prototype.error = function(err) {
  if (!err) {
    throw new Error('No error specified');
  }

  this.errors = this.errors || [];
  if (_.isArray(err)) {
    this.errors = _.union(this.errors, err);
  } else {
    this.errors.push(err.toString());
  }
  return this;
}


ResponseHandler.prototype.debug = function(val) {
  this.enableDebug = _.isBoolean(val) ? val : true;
  return this;
}


ResponseHandler.prototype.render = function() {
  return new ResponseExecutor(this);
}

ResponseHandler.prototype.redirect = function(redirectPath) {
  if (!_.isString(redirectPath)) {
    throw new Error('No redirectPath specified');
  }
  this.code(this.STATUS.REDIRECT);
  this.redirectPath = redirectPath;
  return new ResponseExecutor(this);
}



function ResponseExecutor(resHandler) {

  this.done = function() {
    var accept = resHandler.req.headers.accept || '';
    if (~accept.indexOf('json')) {
      resHandler.json();
    }

    if(!_.isObject(resHandler.meta)){
      _.isArray(resHandler.errors) ? resHandler.code(DEFAULT_ERROR_CODE) : resHandler.code(DEFAULT_SUCCESS_CODE);
    }

    if(resHandler.forceJson || !_.isString(resHandler.resView)){
      apiResponse(resHandler, resHandler.enableDebug);
    } else {
      htmlResponse(resHandler, resHandler.enableDebug);
    }
  }

};





module.exports.ResponseHandler = function(req, res) {
  return new ResponseHandler(req, res);
}