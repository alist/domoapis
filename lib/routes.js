var fs = require('fs'); //filesystem
var path = require('path');
var defaultHome = 'home';


module.exports = function(app){

  var routeModules = loadRoutes(app);

  routeModules['public'].forEach(function(fnPublicRoute){
    fnPublicRoute.call(this, app);
  });

  // All authenticated routes follow
  routeModules['verif'].forEach(function(fnVerifRoute){
    fnVerifRoute.call(this, app);
  });

  // User Homepage
  app.get('/', function(req, res){
    // Special case when different userTypes have different homepages
    if(req.user && req.user.userType && routeModules['index'][req.user.userType]){
      return routeModules['index'][req.user.userType].call(this, req, res);
    }
    return routeModules['index'][defaultHome].call(this, req, res);
  });

  routeModules['private'].forEach(function(fnPrivateRoute){
    fnPrivateRoute.call(this, app);
  });

  // Catch all else and redir to /
  app.all('*', function(req, res){
    res.redirect('/');
  });
};


// Synch scans through rootDir/routes/*. and constructs more routes
function loadRoutes(app) {
  var routesDir = path.join(__dirname, '..', 'routes');
  var files = fs.readdirSync(routesDir);
  files.sort();

  if(files.indexOf(defaultHome + '.js') < 0){
    throw new Error(path.join(routesDir, 'home.js') + ' not found');
  }

  var moduleInterface, routeModules = {
    'public': [],
    'verif': [],
    'private': [],
    'index': {}
  };

  var includeModules = files.forEach(function(fname) {
    fname = fname.substring(0, fname.length - 3);
    moduleInterface = require(path.join(routesDir, fname));

    Object.keys(routeModules).forEach(function(pathType){
      if(typeof moduleInterface[pathType] === 'function'){
        if(pathType === 'index'){
          routeModules[pathType][fname] = moduleInterface[pathType];
        } else {
          routeModules[pathType].push(moduleInterface[pathType]);
        }
      }
    });
  });

  return routeModules;
}
