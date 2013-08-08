

var env = 'test';
var Config = require('./configLoader').init(env)
  , mongoose = require('mongoose')
  , orgData = require('./test/data/orgData').orgData
  , OrganizationModel = require('./model/organization').Organization


function connectDb(callback){
  var uristring = Config.getConfig().db.dbUri;

  mongoose.connect(uristring, function(err, res) {
    if(err){ 
      console.log('ERROR connecting to: ' + uristring + '. ' + err);
      return callback(err);
    }
    console.log('Connnected to ' + uristring);
    return callback();
  });
}

// DB Conn
connectDb(function(err){
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
       OrganizationModel.getById(o.id, function(err, org){
           if(err){
               console.log(err);
               return checkDone();
           }
           
           if(!!org){
               existingItems++;
               return checkDone();
           }

           o.code = o.orgURL.substring(0, 4);
           if(o.code.length < 4) {
            o.code = o.code + Math.random().toString(36).substring(2, 6 - o.code.length);
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