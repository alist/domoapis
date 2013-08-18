var utils = require('./utils')
  , _ = require('lodash')


module.exports = function(app) {
  var apiPath = app.get('apiPath');
  app.use(function (req, res, next) {
    res.ext = new ResponseHandler(req, res);
    if(apiPath && req.path.indexOf(apiPath) === 0) {
      res.ext.json();
    }
    next();
  });
}


// Request props for logging/debugging
var requestProps = [ 'path', 'params', 'query', 'method', 'body', 'headers' ];

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



function apiResponse(resHandler) {

  // merge flash data and resData
  if(_.isObject(resHandler.reqFlashData)) {
    resHandler.resData = mergeData(resHandler.resData, resHandler.reqFlashData);
  }

  var responseObj = {
    meta: resHandler.meta,
    response: resHandler.resData || {}
  };

  if (resHandler.hasErrors) {
    responseObj.errors = resHandler.errors;
  }

  resHandler.meta.statusCode = (resHandler.meta.statusCode < 400) ? 200 : resHandler.meta.statusCode;
  resHandler.res.json(resHandler.meta.statusCode, responseObj);

  if (resHandler.enableDebug) {
    console.log('----');
    utils.print('req.method', resHandler.req.method);
    utils.print('req.path', resHandler.req.path);
    utils.print('response.body', responseObj);
    console.log('----');
  }  
}



function htmlResponse(resHandler) {

  if(_.isString(resHandler.redirectPath)) {
    return resHandler.res.redirect(resHandler.redirectPath);
  }

  var res = resHandler.res;

  // Setup res.locals
  if(_.isObject(resHandler.resLocals)) {
    res.locals = mergeData(res.locals, resHandler.resLocals);
  }

  var viewData = mergeData(resHandler.resData, resHandler.resViewData);

  if (resHandler.hasErrors) {
    viewData.errors = resHandler.errors;
  }

  res.status(resHandler.meta.statusCode);
  res.render(resHandler.renderView, viewData);

  if (resHandler.enableDebug) {
    console.log('----');
    utils.print('req.method', resHandler.req.method);
    utils.print('req.path', resHandler.req.path);
    utils.print('meta', resHandler.meta);
    utils.print('renderView', resHandler.renderView);
    utils.print('viewData', viewData);
    utils.print('res.locals', resHandler.res.locals);
    console.log('----');
  }
}




var ResponseHandler = function(req, res) {

  this.STATUS = statusCodes;

  this.req = _.pick(req, requestProps);
  this.reqFlash = req.flash.bind(req);
  this.res = res;

  this.meta = null;
  
  this.resView = null;
  this.resErrView = null;

  this.reqFlashData = null;
  this.resData = null;
  this.resLocals = null;
  this.resViewData = null;
  this.errors = null;

  this.redirectPath = null;

  this.resJson = false;
  this.forceJson = ~(req.headers.accept || '').indexOf('json');

  this.hasErrors = false;
  this.renderView = null;

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
  if (!this.resErrView) {
    this.resErrView = view;
  }
  return this;
}

// output: json, even if client requested html
ResponseHandler.prototype.json = function(val) {
  this.resJson = _.isBoolean(val) ? val : true;
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

// req.flash('accountApproved', *) and res.json(*)
ResponseHandler.prototype.flash = function(key, value) {
  var fl = {};
  fl[key] = value;
  this.reqFlashData = mergeData(this.reqFlashData, fl);
  this.reqFlash(key, value);
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

ResponseHandler.prototype.exec = function(delayed) {
  var respExc = new ResponseExecutor(this);
  if(_.isBoolean(delayed) && delayed) {
    return respExc;
  }
  return respExc.done();
}

ResponseHandler.prototype.render = function(delayed) {
  return this.exec(delayed || false);
}


ResponseHandler.prototype.redirect = function(redirectPath, delayed) {
  if (!_.isString(redirectPath)) {
    throw new Error('No redirectPath specified');
  }
  this.code(this.STATUS.REDIRECT);
  this.redirectPath = redirectPath;

  return this.exec(delayed || false);
}



function ResponseExecutor(resHandler) {

  this.done = function() {
    
    if (resHandler.forceJson) {
      resHandler.json();
    }

    resHandler.hasErrors = _.isArray(resHandler.errors) && (resHandler.errors.length > 0);

    if (!_.isObject(resHandler.meta)) {
      resHandler.hasErrors ? resHandler.code(DEFAULT_ERROR_CODE) : resHandler.code(DEFAULT_SUCCESS_CODE);
    }

    resHandler.renderView = resHandler.hasErrors ? resHandler.resErrView : resHandler.resView;

    if (resHandler.resJson || (!resHandler.redirectPath && !resHandler.renderView)) {
      apiResponse(resHandler);
    } else {
      htmlResponse(resHandler);
    }
  }

};