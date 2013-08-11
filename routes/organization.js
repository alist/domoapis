var OrganizationController = require('../controller/organization').OrganizationController
  , UserController = require('../controller/user').UserController


function loadOrgInfo(app){
    app.param('organization', function(req, res, next, orgUrl) {
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
    });
}

function orgCheck(app){
    app.all('/:organization*', function(req, res, next){
        if(!req.extras || !req.extras.organization) {
            // not an org route. someone else handles this
            return next();
        }
        
        if (req.isAuthenticated()) {
            // continues the request, sending it to the next matching route
            return next();
        }

        req.flash('error', 'You need to login to perform this action.');
        req.flash('redirTo', req.path);
        return res.ext.redirect('/login');
    });
}

module.exports.private = function(app) {
    app.get('/:organization/giveadvice', OrganizationController.giveAdvice.bind(OrganizationController));
}

module.exports.verif = function(app) {
    orgCheck(app);
}

module.exports.public = function(app) {
  loadOrgInfo(app);

  app.get('/:organization/getadvice', OrganizationController.getAdvice.bind(OrganizationController));  
  app.get('/:organization', OrganizationController.getInfo.bind(OrganizationController));
  app.get('/:organization/register', UserController.getRegister.bind(UserController));
  app.post('/:organization/register', UserController.register.bind(UserController));

};

