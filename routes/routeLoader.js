
var api = require('./api')
  , home = require('./home')
  , organization = require('./organization')
  , shorturl = require('./shorturl')

// route load order
var routeLoadOrder = module.exports.routeLoadOrder = [
  api,
  home,
  organization,
  shorturl
];




// route-type load order
var routeTypeLoadOrder = module.exports.routeTypeLoadOrder = [
  'public',
  'verif',
  'private'
];


module.exports.init = function(app){

  app.all('*', function(req, res, next) {
    req.extras = req.extras || {};
    next();
  });

  routeTypeLoadOrder.forEach(function(routeType) {
    routeLoadOrder.forEach(function(route) {
      if(typeof route[routeType] === 'function'){
        route[routeType].call(this, app);
      }
    });
  });

  // catch-all last route
  app.all('*', function(req, res) {
    res.redirect('/');
  });
};
