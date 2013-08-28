
module.exports.defaultsKey = 'defaults';

module.exports.overridesKey = 'overrides';

module.exports.envList = [ 'production', 'development', 'test' ];

module.exports.activeEnv = process.env.NODE_ENV || 'development';



module.exports.app = {};

module.exports.app.defaults = {
  primaryhost: "domo-io.herokuapp.com",
  env: {
    port: process.env.PORT || 3000,
    rootDir: __dirname
  },
  api: {
    endpoint: '/api/',
    version: '1',
    path: '/api/v1',
    tokenOptions: {
      secret: 'unpr3d1ct@bl3str1ngF0ll0ws-owkcfjefoe93msl4',
      timeStep: 7 * 24 * 60 * 60,
      schemaKey: '_id'
    }
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
  host: "ds059887.mongolab.com",
  port: "59887",
  user: "test",
  password: "c0mpl3xity",
  db: "domo_test"
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
  host: "smtp.buggycoder.com",
  port: 587,
  secureConnection: false,
  auth: {
    user: "shirish@buggycoder.com",
    pass: "VTkrZ(%7"
  },
  from: "\"Buggy Coder, Inc.\" <shirish@buggycoder.com>",
  adminEmails: ['shirishk.87@gmail.com', 'harishnk@gmail.com']
};



module.exports.messenger = {};

module.exports.messenger.defaults = {
  service: {
    sid: 'AC3b723c31db8d97180127711305f40755',
    token: 'f04fefd0272893b7ad0d664ec00d5737'
  },
  options: {
    from: '+16468074202'
  }
};