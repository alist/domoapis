secrets = require ('./secrets')
primaryHost = secrets.primaryHost
hostURL = "https://#{primaryHost}"
request = require 'request'

home = require('./routes/home')
roughdraft = require('./routes/roughdraft')
advice = require('./routes/advice')
redirstat = require('./routes/redirstat')
supporters = require('./routes/supporters')
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
 
  @get '/', home.home
  
  #we want https unless index
  @get '/*': ->
    if @request.headers['host'] == '127.0.0.1:3000' || @request.headers['host'] == 'localhost:3000'
      @next()
    else if @request.headers['x-forwarded-proto']!='https'
      @redirect "#{hostURL}#{@request.url}"
    else
      @next()


  @get '/getadvice', advice.form

  @post '/getadvice', advice.getadvice_post
  
  @get '/giveadvice', advice.advice_pending
  
  @post '/giveadvice', advice.giveadvice_post

  @get '/giveadvice/:id', advice.advice_detail
  
  @get '/supporters', supporters.principles_list

  @get '*', (req, res)->
    @redirect '/'
  
 
port = if process.env.PORT > 0 then process.env.PORT else 3000
domoApp.app.listen port
console.log "starting on port # #{port}"
communicationsModel.comSetup domoApp
