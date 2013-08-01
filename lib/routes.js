var fs = require('fs'); //filesystem
var defaultHome = 'home';

 var Utils = require('../lib/utils')
  , Response = Utils.Response;

module.exports = function(app, config){
  var routeModules = loadRoutes(app, config);

  routeModules['public'].forEach(function(fnPublicRoute){
    fnPublicRoute.call(this, app);
  });
  
    app.all("*", sessionCheck);
  
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

/*var Utils = require('../lib/utils')
  , Response = Utils.Response;*/

// Check auth - email verification etc
var sessionCheck = function(req, res, next) {
  // pass-thru, for now
  // console.log('nothing to verify for now');
   return next();
/*  
  // if you want, you can check login someplace else too. Just uncomment the following.
  if(req.path.match('^/org/*')){
      // let the org routes manage this
      return next();
  }
  
  // for all other private routes that are not /org/*, check session
  if (req.isAuthenticated()) {
    return Response(req, res).redirect('/');
  }

  Response(req, res).render('orglogin.jade', {
    title: "Login",
    username: "",
    error: req.flash("error")
  });*/
};


// Synch scans through rootDir/routes/*. and constructs more routes
function loadRoutes(app, config) {
  var files = fs.readdirSync(__dirname + '/../routes');

  if(files.indexOf(defaultHome + '.js') < 0){
    throw new Error('<root>/routes/home.js not found');
  }

  var moduleInterface, routeModules = {
    'public': [],
    'verif': [],
    'private': [],
    'index': {}
  };
  var includeModules = files.forEach(function(fname) {
    fname = fname.substring(0, fname.length - 3);
    moduleInterface = require('../routes/' + fname);

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
