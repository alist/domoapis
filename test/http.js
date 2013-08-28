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
      // console.log(newOrg);
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
        skills: 'fake empathy',
        orgId: state.organization.id,
        org: state.organization.name
      })
      .set('Accept', 'application/json')
      .end(function (res) {
        res.should.be.json;
        res.should.have.status(200);
        should.exist(res.body.response.userID);

        User.findOne({ userID: res.body.response.userID }, function(err, user) {
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
      .send({
        email: 'shirishk.87@gmail.com',
        password: 'sa123',
        skills: 'fake empathy',
        orgId: state.organization.id,
        org: state.organization.name
      })
      .set('Accept', 'application/json')
      .end(function (res) {
        res.should.be.json;
        res.should.have.status(200);
        should.exist(res.body.response.accApproved);
        res.body.response.accApproved.should.equal(true);
        done();
    });
  });


  it("should login successfully", function(done) {
    request()
    .post('/login?clientId=phone')
    .send({ username: 'shirishk.87@gmail.com', password: 'sa123' })
    .set('Accept', 'application/json')
    .end(function (res) {
      console.log(res.text);
      res.should.be.json;
      res.should.have.status(200);
      should.exist(res.body.response.token);


      User.findOne({ userID: 'shirishk.87@gmail.com', }, function(err, user) {
        user.hasToken(res.body.response.token).should.equal(true);
        done();
      });

      // Save session cookie
      userAgent.saveState(res);
    });
  });


  it("get advice", function(done) {
    request()
      .post(apiPath + '/organizations/' + state.organization.orgURL + '/advicerequest?code=' + state.organization.code)
      .send({
        adviceRequest: 'I need help with this'
      })
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
