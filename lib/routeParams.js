var OrganizationController = require('../controller/organization').OrganizationController


module.exports = function(app) {

  // resolve :organization params
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

          req.extras.organization = res.locals.organization = org;
          return next();
      });
  });

}

