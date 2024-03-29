
module.exports.defaultsKey = 'defaults';

module.exports.overridesKey = 'overrides';

module.exports.envList = [ 'production', 'development', 'test' ];

module.exports.activeEnv = process.env.NODE_ENV || 'development';



module.exports.app = {};

module.exports.app.defaults = {
  primaryhost: "domoapis.herokuapp.com",
  env: {
    port: process.env.PORT || 3000,
    rootDir: __dirname
  },
  api: {
    endpoint: '/api/',
    version: '1',
    path: '/api/v1'
  },
  roleApprovalReq: ['supporter']
};


module.exports.app.overrides = {
  env: {
    port: process.env.PORT
  }
}


module.exports.app.production = {

};


module.exports.cron = {};
module.exports.cron.development = {
  interval: '*/12 * * * * *'
};
module.exports.cron.defaults = {
  interval: '00 */8 * * * *'
};



module.exports.db = {};

module.exports.db.defaults = {
  host: "ds031597.mongolab.com",
  port: "31597",
  user: "domo",
  password: "c0mpl3xity",
  db: "domo"
};

module.exports.db.overrides = {
  dbUri: process.env.MONGODB_URI
}

module.exports.db.production = {
  dbUri: process.env.MONGODB_URI
};

module.exports.db.development = {
  dbUri: process.env.MONGODB_URI
};

module.exports.db.test = {
  dbUri: process.env.MONGODB_URI
};

// Generate dbUri for all envs
Object.keys(module.exports.db).forEach(function(k){
  var c = module.exports.db[k];
  if(!!c.user && !!c.password && !!c.host && !!c.port && !!c.db){
    c.dbUri = "mongodb://" + c.user + ":" + c.password + "@" + c.host + ":" + c.port + "/" + c.db;
  }
});


module.exports.mail = {};

module.exports.mail.defaults = {
  host: "smtp.sendgrid.net",
  port: 587,
  secureConnection: false,
  auth: {
    user: "domo@domo.io",
    pass: "d0m0 is c##l"
  },
  from: "\"Domo \" <domo@domo.io>",
  adminEmails: ['shirishk.87@gmail.com', 'harish@domo.io', 'alex@domo.io']
};


module.exports.messenger = {};

module.exports.messenger.defaults = {
  service: {
    sid: 'AC0b4236c52b08448aa4af6b365557d89a',
    token: '9724f92d942bb0fae61e5c8bac118669'
  },
  options: {
    from: '+14696434686'
  }
};


module.exports.push = {};

module.exports.push.defaults = {
  serverSecret: 'T0K3nF0rS3rV3r',
  ios: {
    gateway: "gateway.sandbox.push.apple.com",
    cert: require('path').resolve(__dirname) + '/modules/push/cert/dev.p12',
    feedbackOptions: {
      address: 'feedback.sandbox.push.apple.com',
      batchFeedback: true,
      interval: 300
    }
  },
  android: {
    key: 'AIzaSyA2MhdNcCwOP17IoWNB2Ndsv67jPbvlloE'
  }
}

module.exports.push.production = {
  serverSecret: 'T0K3nF0rS3rV3r',
  ios: {
    gateway: "gateway.push.apple.com",
    cert: require('path').resolve(__dirname) + '/modules/push/cert/prod.p12',
    feedbackOptions: {
      address: 'feedback.push.apple.com',
      batchFeedback: true,
      interval: 300
    }
  },
  android: {
    key: 'AIzaSyA2MhdNcCwOP17IoWNB2Ndsv67jPbvlloE'
  }
}