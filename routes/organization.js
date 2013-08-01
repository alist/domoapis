 var Utils = require('../lib/utils')
  , Response = Utils.Response
  , ResponseStatus = Utils.ResponseStatus
  , OrganizationController = require('../controller/organization').OrganizationController
  
var excludeApi = "^(?!\/api\/)";
  
function orgLookup(req, res, next){

    var orgUrl = req.params.organization; // validate
    OrganizationController.getByOrgUrl(orgUrl, function(err, org){
        
        if(err || !org){            
            res.locals.organization = {
                error: 'ORG_NOT_FOUND',
                displayName: 'Invalid organization',
                bannerURL: '/invalid/logo.png',
                orgURL: '/invalid'
            };
            //render org_not_found view here and don't call next
            return Response(req, res).render('orglanding', {}).done(); 
        }
        
        req.extras = req.extras || {};
        req.extras.organization = res.locals.organization = org;
        return next();
    });
        
}

function loadOrgInfo(app){
    app.all(excludeApi + '/:organization*', orgLookup);
}

function orgCheck(app){
    app.all(excludeApi + '/:organization*', function(req, res, next){
        console.log('Imma gonna check too: ' + req.extras.organization.displayName); 
        
        if (req.isAuthenticated()) {
            // continues the request, sending it to the next matching route
            return next();
        }

        req.flash('error', 'You need to login to perform this action.');
        req.flash('redirTo', req.path);
        Response(req, res).redirect('/' + req.params.organization + '/login').done();
    });
}

module.exports.private = function(app) {
    app.get(excludeApi + '/:organization/giveadvice', OrganizationController.giveAdvice.bind(OrganizationController));
}

module.exports.verif = function(app) {
    orgCheck(app);
}

module.exports.public = function(app) {
  loadOrgInfo(app);
  
  app.get(excludeApi + '/:organization/login', OrganizationController.login.bind(OrganizationController));
  app.get(excludeApi + '/:organization/getadvice', OrganizationController.getAdvice.bind(OrganizationController));  
  app.get(excludeApi + '/:organization', OrganizationController.getInfo.bind(OrganizationController));

};

