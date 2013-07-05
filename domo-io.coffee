secrets = require ('./secrets')
primaryHost = secrets.primaryHost
hostURL = "https://#{primaryHost}"
request = require 'request'

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

`Array.prototype.unique = function() {    var o = {}, i, l = this.length, r = [];    for(i=0; i<l;i+=1) o[this[i]] = this[i];    for(i in o) r.push(o[i]);    return r;};`

#domoApp = require('zappa').app -> #hnk06/24/2013-
domoApp = require('zappajs').app -> #hnk06/24/2013+
  mongoose.connect(secrets.mongoDBConnectURLSecret)
  @use 'bodyParser', 'static', 'cookies', 'cookieParser', session: {secret: secrets.sessionSecret}
  @set 'view engine': 'jade'

  crypto = require('crypto')
 
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

  @get '/supporters', supporters.principles_list
  @get '/privacyandterms', privacyTerms.privacyandterms_get
  
  @get '/urllogin', auth.urlLogin_get
  @get '/urllogin/:token', auth.urlLogin_get
  
  @get '/getloginurl', auth.shortLoginURLForCurrentUser

  @get '/login', -> @render 'login.jade':{}
 

  @get '/users', auth.userslist_get
  @get '/users/:id', auth.usersdetail_get
  @post '/users', auth.users_post
  @post '/users/:id', auth.usersdetail_post

  @get '/x/*', shorturl.unShortenRedir

  @get '/:org', organization.landing_get

  @get '*', (req, res)->
    @redirect '/'
  
 
port = if process.env.PORT > 0 then process.env.PORT else 3000
#domoApp.app.listen port #to resolve EADDRINUSE error stemming from zappajs and twilio trying to create a webserver simultaneously hnk06/25/13-
console.log "starting on port # #{port}"
communicationsModel.comSetup domoApp
