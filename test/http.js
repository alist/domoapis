var env = process.env.NODE_ENV = (typeof process.env.NODE_ENV !== 'undefined') ? process.env.NODE_ENV : 'test';
// if(env !== 'test') throw new Error('Invalid env');

var config = require('../configLoader').forceEnv(env, true).init().getConfig()
  , app = require('../app').app
  , Utils = require('./inc/dbutils')(config.db.dbUri)
  , Helpers = require('./inc/helpers')
  , util = require('util')
  , _ = require('lodash')
  , qs = require('querystring')

var UserModel = require('../model/user')
  , User = UserModel.User
  , OrgUserModel = require('../model/orguser')
  , OrgUser = OrgUserModel.OrgUser
  , Organization = require('../model/organization').Organization

var should = Helpers.should;
var userAgent = new Helpers.UserAgent(app);
var request = userAgent.request;

var state = {};
var apiPath = config.app.api.path;

var print = function(name, obj){
  if(arguments.length == 1){
    obj = name;
    name = '';
  }
  console.log(name, util.inspect(obj, { depth: null }));
}


describe("HTTP: -- Clearing DB --", function() {
  it(".", function(done) {
    Utils.clearDB(function(){
      done();
    })
  });
});



describe("HTTP: Register new user", function() {

  it("should create new organization", function(done) {
    var newOrgAttrs = {
      "id": "1",
      "displayName": "Massachusetts Institute of Technology",
      "orgURL": "mit",
      "code": "mitl",
      "city": "Cambridge",
      "region": "MA",
      "bannerURL": "/img/banners/mit.png"
    };

    Organization.new(newOrgAttrs, function(err, newOrg){
      should.not.exist(err);
      should.exist(newOrg);
      state.organization = newOrg;
      done();
    });
  });

  it("register new supporter", function(done) {
    request()
      .post('/register')
      .send({
        email: 'shirishk.87@gmail.com',
        password: 'sa123',
        skills: 'empathy',
        orgId: state.organization.id,
        org: state.organization.name
      })
      .set('Accept', 'application/json')
      .end(function (res) {
        res.should.be.json;
        res.should.have.status(200);
        should.exist(res.body.response.user.userID);

        User.findOne({ userID: res.body.response.user.userID }, function(err, user) {
          should.not.exist(err);
          should.exist(user);
          state.user = user;

          OrgUser.get(state.user._id, state.organization._id, function(err, orguser) {
            should.not.exist(err);
            should.exist(orguser);
            state.orguser = orguser;
            done();
          });

        });
    });
  });

  it("approve supporter account", function(done) {

    var approvalLink = '/o/' + state.organization._id + '/u/' + state.user._id + '/account/approval?' + qs.stringify({
        token: state.orguser.accApprovalHash
      });

    request()
      .get(approvalLink)
      .set('Accept', 'application/json')
      .end(function (res) {
        res.should.be.json;
        res.should.have.status(200);
        should.exist(res.body.response.accApproved);
        res.body.response.accApproved.should.equal(true);
        done();
    });
  });


  it("should login successfully: website", function(done) {
    request()
    .post('/login?clientId=phone')
    .send({ username: 'shirishk.87@gmail.com', password: 'sa123' })
    .set('Accept', 'application/json')
    .end(function (res) {
      res.should.be.json;
      res.should.have.status(200);
      should.exist(res.body.response.user._id);
      should.exist(res.body.response.user.token);

      var tokenParts = res.body.response.user.token.split('|');
      var userId = tokenParts.shift();
      var token = tokenParts.join('');

      User.findOne({ userID: 'shirishk.87@gmail.com', }, function(err, user) {
        user.hasToken(token).should.equal(true);
        state.token = res.body.response.user.token;
        done();
      });

      // Save session cookie
      userAgent.saveState(res);
    });
  });


  it("should login successfully: api", function(done) {
    request()
    .post(apiPath + '/user/session')
    .send({ username: 'shirishk.87@gmail.com', password: 'sa123' })
    .set('Accept', 'application/json')
    .end(function (res) {
      res.should.be.json;
      res.should.have.status(200);
      should.exist(res.body.response.user._id);
      should.exist(res.body.response.user.token);

      var tokenParts = res.body.response.user.token.split('|');
      var userId = tokenParts.shift();
      var token = tokenParts.join('');

      User.findOne({ userID: 'shirishk.87@gmail.com', }, function(err, user) {
        user.hasToken(token).should.equal(true);
        state.token = res.body.response.user.token;
        done();
      });

    });
  });


  it("should login successfully again: api", function(done) {
    request()
    .post(apiPath + '/user/session')
    .send({ username: 'shirishk.87@gmail.com', password: 'sa123' })
    .set('Accept', 'application/json')
    .end(function (res) {
      res.should.be.json;
      res.should.have.status(200);
      should.exist(res.body.response.user._id);
      should.exist(res.body.response.user.token);

      var tokenParts = res.body.response.user.token.split('|');
      var userId = tokenParts.shift();
      var token = tokenParts.join('');

      User.findOne({ userID: 'shirishk.87@gmail.com', }, function(err, user) {
        user.tokens.length.should.equal(2); // (1) phone  (2) api
        user.hasToken(token).should.equal(true);
        state.token = res.body.response.user.token;
        done();
      });
    });
  });


  it("check org code", function(done) {
    request()
      .get(apiPath + '/organizations/' + state.organization.orgURL + '/codecheck?code=' + state.organization.code)
      .set('Accept', 'application/json')
      .end(function (res) {
        res.should.be.json;
        res.should.have.status(200);
        should.exist(res.body.response.organization._id);
        done();
    });
  });

  it("check org code: invalid orgcode", function(done) {
    request()
      .get(apiPath
            + '/organizations/' + state.organization.orgURL
            + '/codecheck?code=' + state.organization.code + 'duh')
      .set('Accept', 'application/json')
      .end(function (res) {
        res.should.be.json;
        res.should.have.status(400);
        done();
    });
  });

  it("new advicerequest: invalid orgcode", function(done) {
    request()
      .post(apiPath
              + '/organizations/' + state.organization.orgURL
              + '/advicerequest?code=' + state.organization.code + 'duh')
      .send({
        adviceRequest: 'I need help with this'
      })
      .set('Accept', 'application/json')
      .end(function (res) {
        res.should.be.json;
        res.should.have.status(400);
        done();
    });
  });

  it("new advicerequest", function(done) {
    request()
      .post(apiPath
              + '/organizations/' + state.organization.orgURL
              + '/advicerequest?code=' + state.organization.code)
      .send({
        adviceRequest: 'I need help with this'
      })
      .set('Accept', 'application/json')
      .end(function (res) {
        res.should.be.json;
        res.should.have.status(200);
        should.exist(res.body.response.advicerequest._id);
        should.exist(res.body.response.advicerequest.accessURL);
        state.advicerequest = res.body.response.advicerequest;
        done();
    });
  });


  it("get advicerequest", function(done) {
    request()
      .get(apiPath
            + '/organizations/' + state.organization.orgURL
            + '/advicerequest/' + state.advicerequest._id
            + '?code=' + state.organization.code
            + '&token=' + state.advicerequest.accessToken)
      .set('Accept', 'application/json')
      .end(function (res) {
        res.should.be.json;
        res.should.have.status(200);
        should.exist(res.body.response.advicerequest._id);
        should.exist(res.body.response.advicerequest.accessURL);
        done();
    });
  });


  it("give advice", function(done) {

    var advicerequest = state.advicerequest;
    request()
      .post(apiPath
              + '/organizations/' + state.organization.orgURL
              + '/advicerequest/' + advicerequest._id
              + '/advice'
              + '?token=' + encodeURIComponent(state.token))
      .send({
        advice: 'Here\'s what you need to do.'
      })
      .set('Accept', 'application/json')
      .end(function (res) {
        res.should.be.json;
        res.should.have.status(200);
        should.exist(res.body.response.advicerequest.responses)
        res.body.response.advicerequest.responses.length.should.equal(1);
        state.advice = res.body.response.advicerequest.responses[0];
        done();
    });
  });


  it("give advice: basic auth", function(done) {

    var advicerequest = state.advicerequest;
    request()
      .post(apiPath
              + '/organizations/' + state.organization.orgURL
              + '/advicerequest/' + advicerequest._id
              + '/advice')
      .send({
        advice: 'Here\'s what you also need to do.'
      })
      .set('Authorization', 'Basic ' + new Buffer(state.token).toString('base64'))
      .set('Accept', 'application/json')
      .end(function (res) {
        res.should.be.json;
        res.should.have.status(200);
        should.exist(res.body.response.advicerequest.responses)
        res.body.response.advicerequest.responses.length.should.equal(2);
        done();
    });
  });

  it("advicerequest: mark advice helpful", function(done) {
    request()
      .post(apiPath
              + '/organizations/' + state.organization.orgURL
              + '/advicerequest/' + state.advicerequest._id
              + '/advice/' + state.advice._id
              + '/advicehelpful'
              + '?code=' + state.organization.code
              + '&token=' + state.advicerequest.accessToken)
      .send({ helpful: 1 })
      .set('Accept', 'application/json')
      .end(function (res) {
        res.should.be.json;
        res.should.have.status(200);
        should.exist(res.body.response.advicerequest._id);
        should.exist(res.body.response.advicerequest.accessURL);
        done();
    });
  });

  it("advicerequest: mark advice thankyou", function(done) {
    request()
      .post(apiPath
              + '/organizations/' + state.organization.orgURL
              + '/advicerequest/' + state.advicerequest._id
              + '/advice/' + state.advice._id
              + '/advicethankyou'
              + '?code=' + state.organization.code
              + '&token=' + state.advicerequest.accessToken)
      .send({ thankyou: 1 })
      .set('Accept', 'application/json')
      .end(function (res) {
        res.should.be.json;
        res.should.have.status(200);
        should.exist(res.body.response.advicerequest._id);
        should.exist(res.body.response.advicerequest.accessURL);
        done();
    });
  });
});



describe("HTTP: Push Notifications", function() {

  var dummyDeviceToken = 'EE66489F304DC75B8D6E8200DFF8A456E8DAEACEC428B427E9518741C92C6660';
  var dummyDeviceToken2 = 'FE66489F304DC75B8D6E8200DFF8A456E8DAEACEC428B427E9518741C92C6660';


  it("push register", function(done) {
    request()
      .post(apiPath
              + '/push/register'
              + '?token=' + encodeURIComponent(state.organization.orgURL + '|' + state.organization.code))
      .send({ deviceType: 'ios', deviceMeta: { model: 'iPhone5S' }, deviceToken: dummyDeviceToken })
      .set('Accept', 'application/json')
      .end(function (res) {
        res.should.be.json;
        // print('register', res.body);
        res.should.have.status(200);
        should.exist(res.body.response.subscriberId);
        res.body.response.deviceToken.should.equal(dummyDeviceToken);
        state.subscriberId = res.body.response.subscriberId;
        state.deviceId = res.body.response.deviceId;
        done();
    });
  });


  it("new advicerequest with subscriberId", function(done) {
    request()
      .post(apiPath
              + '/organizations/' + state.organization.orgURL
              + '/advicerequest?code=' + state.organization.code)
      .send({
        adviceRequest: 'I need help with this',
        subscriberId: state.subscriberId
      })
      .set('Accept', 'application/json')
      .end(function (res) {
        res.should.be.json;
        res.should.have.status(200);
        should.exist(res.body.response.advicerequest._id);
        should.exist(res.body.response.advicerequest.accessURL);
        should.exist(res.body.response.advicerequest.subscriberId);
        state.advicerequest = res.body.response.advicerequest;
        done();
    });
  });

  it("give advice", function(done) {

    var advicerequest = state.advicerequest;
    request()
      .post(apiPath
              + '/organizations/' + state.organization.orgURL
              + '/advicerequest/' + advicerequest._id
              + '/advice'
              + '?token=' + encodeURIComponent(state.token))
      .send({
        advice: 'Here\'s what you need to do.'
      })
      .set('Accept', 'application/json')
      .end(function (res) {
        res.should.be.json;
        res.should.have.status(200);
        should.exist(res.body.response.advicerequest.responses)
        res.body.response.advicerequest.responses.length.should.equal(1);
        state.advice = res.body.response.advicerequest.responses[0];
        done();
    });
  });


  it("push devicetoken update", function(done) {
    request()
      .post(apiPath
              + '/push/devicetoken')
      .send({ subscriberId: state.subscriberId, deviceId: state.deviceId, deviceToken: dummyDeviceToken2 })
      .set('Accept', 'application/json')
      .end(function (res) {
        res.should.be.json;
        // print('devicetoken', res.body);
        res.should.have.status(200);
        res.body.response.deviceToken.should.equal(dummyDeviceToken2);
        done();
    });
  });


  it("push event", function(done) {
    request()
      .post(apiPath
              + '/push/event'
              + '?secret=' + encodeURIComponent(config.push.serverSecret))
      .send({ subscriberId: state.subscriberId, payload: { data1: '1', data2: '2' }, alert: 'You have a new message', options: { badge: 1 } })
      .set('Accept', 'application/json')
      .end(function (res) {
        res.should.be.json;
        // print('event', res.body);
        res.should.have.status(200);
        done();
    });
  });
});