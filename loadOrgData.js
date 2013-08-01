var dbConfig = require('./dbConfig')
  , db = require('./lib/db')
  , orgData = require('./test/data/orgData').orgData
  , OrganizationModel = require('./model/organization').Organization


// DB Conn
db({}, function(err){
    if(err){
      // abort!
      console.log(err);
      return;
    }
    console.log('Connected');
    
    var total = orgData.length;
    var existingItems = 0, newItems = 0;
    var checkDone = function(){
        if(--total === 0){
            console.log('existingItems: ' + existingItems);
            console.log('newItems: ' + newItems);
            process.exit(0);
        }
    }
    
    orgData.forEach(function(o){
       OrganizationModel.findById(o.id, function(err, org){
           if(err){
               console.log(err);
               return checkDone();
           }
           
           if(!!org){
               existingItems++;
               return checkDone();
           }
           
           newItems++;
           OrganizationModel.newOrganization(o, function(err, newOrg){
               if(err){
                   console.log('err: ' + err);
               }
               return checkDone();
           });
            
       });
    });
    
});