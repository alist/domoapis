 var OrganizationController = require('../controller/organization').OrganizationController
  
var excludeApi = "^(?!\/api\/)";
  
function orgLookup(req, res, next){

    var orgUrl = req.params.organization; // validate
    OrganizationController.getByOrgUrl(orgUrl, function(err, org){
        
        if(err || !org){      
            res.ext.code(res.ext.STATUS.NOT_FOUND);
            res.ext.data({ 
                organization : {
                    error: 'ORG_NOT_FOUND',
                    displayName: 'Invalid organization',
                    bannerURL: '/invalid/logo.png',
                    orgURL: '/invalid'
                }
            }, true);
            //render org_not_found view here and don't call next
            return res.ext.view('orglanding').render(); 
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
        return res.ext.redirect('/' + req.params.organization + '/login');
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

