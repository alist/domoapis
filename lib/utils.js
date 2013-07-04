var config = require('../secrets').config;

module.exports.getDomainFromRequest = function(req) {
  return req.protocol + '://' + req.host  + ':' + config.env.port;
}

var statusCodes = {
  REDIRECT: 302,
  FORBIDDEN: 403,
  BAD_REQUEST: 400,
  OK: 200
};

module.exports.ResponseStatus = statusCodes;

module.exports.Response = function(_req, _res) {

  return (function(){
    this.req = _req;
    this.res = _res;
    this.user = req.user;

    this.render = function (apiResCode, view, responseObj, metaObj){

      var req = this.req;
      var res = this.res;
      var resCode = apiResCode;

      if(arguments.length === 2){
        // (view, responseObj)
        resCode = statusCodes.OK;
        responseObj = view;
        view = apiResCode;
      }

      if(!responseObj) {
        throw Error('Required: responseObj');
      }

      responseObj = responseObj || {};
      responseObj.meta = metaObj || {};
      responseObj.meta.statusCode = resCode;
      responseObj.meta.status = (resCode < 400 && typeof responseObj.errors === 'undefined') ? 'success' : 'error';

      responseObj.notifications = {}; // TBD

      if(!!this.user) {
        res.locals.user = this.user;
      }

      res.format({
        'text/html': function(){

          if(!!req.siteSection) {
            responseObj.siteSection = req.siteSection;
          }
          
          res.render(view, responseObj);
        },
        
        'application/json': function(){
          delete responseObj.title;
          res.json(resCode, responseObj);
        }
      });
    }

    this.redirect = function (apiResCode, path, responseObj, metaObj){
      var res = this.res;
      var resCode = apiResCode;
      if(arguments.length === 2){
        // (path, responseObj)
        resCode = statusCodes.OK;
        responseObj = path;
        path = apiResCode;
      } else if(arguments.length === 1){
        // (path)
        path = apiResCode;
        resCode = statusCodes.OK;
      }

      if(!path) {
        throw new Error('Invalid path: ' + path);
      }

      responseObj = responseObj || {};
      responseObj.meta = metaObj || {};
      responseObj.meta.statusCode = resCode;
      responseObj.meta.status = (resCode < 400 && typeof responseObj.errors === 'undefined') ? 'success' : 'error';
      responseObj.redirectTo = path;

      res.format({
        'text/html': function(){
          res.redirect(path);
        },
        
        'application/json': function(){
          delete responseObj.title;
          res.json(resCode, responseObj);
        }
      });
    }

    return this;
  })();
}