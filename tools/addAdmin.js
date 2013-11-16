// set environment here (or shell env will be used)
var env = 'test'; //process.env.NODE_ENV;

// set attribs for new user
var newU =   {
    "email": "harish@domo.io",
    "password": "letmein",
    "orgId": 103, // the "id" field in the org object
    "roles": {
      "supporter": {
         "supportAreas": [ 'career' ]
      },
      "admin": {},
      "moduleadmin": {},
      "adopter": {}
    }
};

// CODE

var opWait = 10;

var forcedEnv = env || ((typeof process.env.NODE_ENV !== 'undefined') ? process.env.NODE_ENV : 'test');

var configLoader = require('../configLoader').forceEnv(forcedEnv, true).init()
  , config = configLoader.getConfig()
  , util = require('util')
  , mongoose = require('mongoose')
  , async = require('async')
  , UserModel = require('../model/user')
  , User = UserModel.User
  , OrgUserModel = require('../model/orguser')
  , OrgUser = OrgUserModel.OrgUser


var print = function(name, obj){
  if(arguments.length == 1){
    obj = name;
    name = '';
  }

  if(typeof obj === 'string') {
    console.log(name, obj);
  } else {
    console.log(name, util.inspect(obj, { depth: null }));
  }
}


print('Using environment', configLoader.activeEnv);
print('[ENSURE THIS IS AS DESIRED] Connecting to database', config.db.dbUri);

print('Executing in ' + opWait + ' secs\n');
print('Press Ctrl+C to cancel\n');

var i = opWait;
var tmr = setInterval(function() {
    print(--i + '...')

    if(i <= 0) {
        clearInterval(tmr);
        newUser(config, newU);
    }
}, 1000);



function newUser(config, newU) {
    mongoose.connect(config.db.dbUri, function(err) {
        if(err) {
            throw err;
        }

        async.waterfall([
            function(done) {
              User.register(newU, function(err, user, orguser, org) {
                return done(err, user, orguser, org);
              });
            },

            function(user, orguser, org, done) {
              if(orguser.accApproved) {
                return done(null, user, orguser, org);
              }

              OrgUser.approveAccount({ userId: user._id, orgId: org._id }, function(err, orguser) {
                return done(null, user, orguser, org);
              });
            }
        ], function(err, user, orguser, org) {
            if(err) {
                throw err;
            }

            print('Operation completed successfully');
            print('user', user);
            print('orguser', orguser);
        });
    });
}
=======
}
>>>>>>> 0888c9d2959f839c02963a6d2d6d09e5ea31b82e
