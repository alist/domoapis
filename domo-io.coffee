secrets = require ('./secrets')
primaryHost = secrets.primaryHost
hostURL = "https://#{primaryHost}"
request = require 'request'

home = require('./routes/home')
roughdraft = require('./routes/roughdraft')
advice = require('./routes/advice')
#opinions = require('./routes/opinions')
redirstat = require('./routes/redirstat')
shorturl = require('./routes/shorturl')

mongoose = require('mongoose')
Schema = mongoose.Schema


#authorModel = require('./model/author')
#adviceModel = require('./model/advice')
communicationsModel = require('./model/communications')

`Array.prototype.unique = function() {    var o = {}, i, l = this.length, r = [];    for(i=0; i<l;i+=1) o[this[i]] = this[i];    for(i in o) r.push(o[i]);    return r;};`

domoApp = require('zappa').app ->
  mongoose.connect(secrets.mongoDBConnectURLSecret)
  @use 'bodyParser', 'static', 'cookies', 'cookieParser', session: {secret: secrets.sessionSecret}

  crypto = require('crypto')
 
  #we want https
  @get '/s/*': ->
    if @request.headers['host'] == '127.0.0.1:3000' || @request.headers['host'] == 'localhost:3000'
      @next()
    else if @request.headers['x-forwarded-proto']!='https'
      @redirect "#{hostURL}#{@request.url}"
    else
      @next()

  @get '/', home.home

  @get '/advice': -> @redirect '/s/advice'

  @get '/s/advice', advice.form

  @post '/s/advice', advice.form_post

  ###
  @get '/opinions', opinions.opinions
  
  @get '/r/*', redirstat.redir

  @get '/s/code': ->
    sessionToken = @request.cookies?.sessiontoken
    author.authCurrentAuthorWithIDAndTokenForSession null, null, sessionToken, (err, author) =>
      if author?
        @render code: {localAuthor: author}
      else
        @render index: {message: "login first", locals:{ redirectURL: @request.originalUrl}, localAuthor:author}
 
 
  @get '/s/login', (req, res) ->
    fbAccessToken = req.query.token
    sessionToken = @request.cookies?.sessiontoken
    
    if sessionToken? == false
      current_date = (new Date()).valueOf().toString()
      random = Math.random().toString()
      hash = crypto.createHash('sha1').update(current_date + random).digest('hex')
      sessionToken = "OFFER_#{hash}"
      if @request.headers['host'] == 'localhost:3000'
         req.response.cookie 'sessiontoken', sessionToken, {httpOnly: true, maxAge: 90000000000 }
      else
         req.response.cookie 'sessiontoken', sessionToken, {httpOnly: true, secure: true, maxAge: 90000000000 }
  
    author.authCurrentAuthorWithIDAndTokenForSession null, fbAccessToken, sessionToken, (err, author) =>
      if author?
        console.log "auth or create for sessionid# #{sessionToken} finished with err #{err}"
        #we'll update with some newer stuff if need-be here
        setAuthorDefaultsIfNeeded author, (updatedAuthor) =>
          redirectURL = req.query.redirectURL
          if redirectURL
            @redirect redirectURL
          else
            @redirect '/'
      else
        redirectURL = req.query.redirectURL
        console.log "bad login for author w/ redirect #{redirectURL}, token #{fbAccessToken} and err #{err}"
        @render index: {message: "login denied; please login", locals:{ redirectURL:redirectURL}}

  @get '/logout', (req, res)->
    req.response.clearCookie 'sessiontoken' # clear the cookie
    req.redirect '/'

  @get '/email', (req, res)->
    emailCal = 'https://www.google.com/calendar/embed?src=fjsre16j05t07v2kg8nr7h82d0%40group.calendar.google.com&ctz=America/New_York'
    req.redirect emailCal
  
  @get '/x/*', shorturl.shorten

  @get '/*', shorturl.unShortenRedir
  ###
  @get '*', (req, res)->
    @redirect '/'
  
 
port = if process.env.PORT > 0 then process.env.PORT else 3000
domoApp.app.listen port
console.log "starting on port # #{port}"
communicationsModel.comSetup domoApp
