secrets = require ('./secrets')
primaryHost = secrets.primaryHost
hostURL = "https://#{primaryHost}"
request = require 'request'

#hnk07/03/2013+{
flash = require('connect-flash')
Validator = require('validator').Validator
passport = require('passport')
LocalStrategy = require('passport-local').Strategy
Utils = require('./lib/utils')
Response = Utils.Response
ResponseStatus = Utils.ResponseStatus
_ = require('underscore')
#hnk07/03/2013+}

home = require('./routes/home')
advice = require('./routes/advice')
organization = require('./routes/organization')
privacyTerms = require('./routes/privacyandterms')
auth = require './routes/auth'
redirstat = require('./routes/redirstat')
supporters = require('./routes/supporters')
shorturl = require('./routes/shorturl')

mongoose = require('mongoose')
Schema = mongoose.Schema


communicationsModel = require('./model/communications')

#hnk07/03/2013+{
SupporterAccountController = require("./controller/useraccount")["SupporterAccountController"]

configureAuth = ->
  passport.use new LocalStrategy(
    passReqToCallback: true
  , (req, username, password, done) ->
    SupporterAccountController.auth username, password, done
  )
  passport.serializeUser (user, done) ->
    done null, user

  passport.deserializeUser (user, done) ->
    SupporterAccountController.findUserById user.id, (err, user) ->
      done err, user

configureValidator =->
    Validator::error = (msg) ->
      @_errors.push msg  unless _.contains(@_errors, msg)
      this
    
    Validator::getErrors = ->
      @_errors

sessionCheck = (req, res, next) ->
  return next()   if typeof req.user isnt "undefined"
  Response(req, res).redirect ResponseStatus.BAD_REQUEST, "/login",
    message: "You need to authenticate successfully to access this resource."
#hnk07/03/2013+}

`Array.prototype.unique = function() {    var o = {}, i, l = this.length, r = [];    for(i=0; i<l;i+=1) o[this[i]] = this[i];    for(i in o) r.push(o[i]);    return r;};`

#domoApp = require('zappa').app -> #hnk06/24/2013-
domoApp = require('zappajs').app -> #hnk06/24/2013+
  mongoose.connect(secrets.mongoDBConnectURLSecret)
  
  #hnk07/03/2013+{
  @use @express.static(__dirname + '/public'),
    @express.cookieParser(),
    @express.bodyParser(),
    @express.session({secret: secrets.sessionSecret}),
    passport.initialize(),
    passport.session(),
    flash(),
    @express.methodOverride()

  @set 'view engine': 'jade'
  
  @locals.pretty = true
  
  configureAuth()
  configureValidator()
  #hnk07/03/2013+}###
  
  crypto = require('crypto') #hnk07/03/2013-
 
  @get '/', home.home
  
  #we want https unless index
  @get '/*': ->
    if @request.headers['host'] == '127.0.0.1:3000' || @request.headers['host'] == 'localhost:3000'
      @next()
    else if @request.headers['x-forwarded-proto']!='https'
      @next()
      #@redirect "#{hostURL}#{@request.url}"
    else
      @next()


  @get '/getadvice', advice.form

  @post '/getadvice', advice.getadvice_post
  
  #hnk07/03/2013+{
  @post "/register", SupporterAccountController.register.bind(SupporterAccountController)
  @get "/register", (req, res) ->
    return Response(req, res).redirect("/")  if req.isAuthenticated()
    Response(req, res).render "register.jade",
      title: "Register"
      email: ""

  
  @get '/login', (req, res) ->
    return Response(req, res).redirect('/')  if req.isAuthenticated()
    Response(req, res).render 'login.jade',
      title: "Login"
      username: ""
      error: req.flash("error")
      
  ###@get '/login', ->
    @render 'login.jade', layout: 'layout.jade'###
    
  #@get '/login', -> @render 'login.jade':{}    

  @post "/login", passport.authenticate("local",
      failureRedirect: "/login"
      failureFlash: true
    ), (req, res) ->
      Response(req, res).redirect "/"
  #hnk07/03/13+}
  
  @get '/giveadvice', advice.advice_pending
  @get '/giveadvice/admin', advice.advice_pending
  
  @post '/giveadvice', advice.giveadvice_post

  @get '/giveadvice/:id', advice.advice_detail

  @get '/notify/:id', advice.notifySupportersForAdviceRequest_get
  @get '/notify', advice.notifySupportersForAdviceRequest_get
  @get '/approve/:id', advice.approveAdviceRequest_get
  @get '/approve/:id/:adviceIndex', advice.approveResponseWithAdviceRequestID_get
  
  @get '/flag/:id', advice.flagAdviceRequest_get

  @get '/viewadvice/:accessToken', advice.adviceViewWithAdviceToken
  
  @get '/viewadvice/:accessToken/:authToken', advice.adviceViewWithAdviceToken

  @post '/viewadvice/:accessToken', advice.getAdviceWithAdviceTokenAndPostedAuthToken
  
  @post '/setadvicehelpful/:accessToken', advice.postAdviceHelpfulWithAdviceTokenAndPostedAuthToken
  
  @get '/organizations', organization.displayOrgs_get

  @post '/inviterequest', home.postInviteRequest #hnk06/26/2013+

  #api
  @get '/apiv1/advice/:accessToken', advice.adviceGETWithAdviceToken
  @post '/apiv1/advice', advice.getadvice_post
  
  @post '/apiv1/advice/advicethankyou/:accessToken', advice.postAdviceThankyouWithAdviceTokenAndPostedAuthToken    #hnk06/25/13+
  
  @post '/apiv1/advice/advicerequestclosed/:accessToken', advice.postAdviceRequestClosedWithAdviceToken            #hnk06/25/13+
  
  @post '/apiv1/home/inviterequest/:emailAddress', home.postInviteRequest                                          #hnk06/26/13+

  @post '/apiv1/organizations/codeAuth', organization.postCodeAuth

  @get '/supporters', supporters.principles_list
  @get '/privacyandterms', privacyTerms.privacyandterms_get
  
  @get '/urllogin', auth.urlLogin_get
  @get '/urllogin/:token', auth.urlLogin_get
  
  @get '/getloginurl', auth.shortLoginURLForCurrentUser

  @get '/users', auth.userslist_get
  @get '/users/:id', auth.usersdetail_get
  @post '/users', auth.users_post
  @post '/users/:id', auth.usersdetail_post

  @get '/x/*', shorturl.unShortenRedir

  @get '/:org', organization.landing_get
  @get '/:org/getadvice', organization.adviceForm_get

  @get '*', (req, res)->
    @redirect '/'
  
 
port = if process.env.PORT > 0 then process.env.PORT else 3000
#domoApp.app.listen port #to resolve EADDRINUSE error stemming from zappajs and twilio trying to create a webserver simultaneously hnk06/25/13-
console.log "starting on port # #{port}"
communicationsModel.comSetup domoApp
