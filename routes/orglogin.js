 var Utils = require('../lib/utils')
  , Response = Utils.Response
  , ResponseStatus = Utils.ResponseStatus

// module.exports.public = function(app) {

  //   app.get('/org/:organization*', function(req, res, next){
  //       // lOokup req.params.organization in the database
  //       // if(organizationFound) {
  //       req.extras = req.extras || {};
  //       req.extras.organization = {
  //           displayName: 'Domo Arrigato | You looked up: ' + (req.params.organization || ''),
  //           bannerURL: '/img/banners/mit.png',
  //           orgURL: 'mit'
  //       };
  //       //}
        
  //       next(); // continues the request, sending it to the next matching route
  //   });
    
  // app.get('/org/:organization/login', function(req, res){
     
  //   // lOokup req.params.organization in the database
  //   // put the result in res.locals
  //   if(req.extras && req.extras.organization){
  //       res.locals.organization = req.extras.organization;
  //   } else {
  //       // take the user to an error page
        
  //       //for now.
  //       res.locals.organization = {
  //           displayName: 'Invalid organization',
  //           bannerURL: '/invalid/logo.png',
  //           orgURL: '/invalid'
  //       };
  //   }

  //   return Response(req, res).render('orglogin', {}).done();
  // });
// };