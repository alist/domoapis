tbApp = require('zappa').app ->
  @use 'static'
  @get '/': 'time to tour'
  
  @get '/concerts', (req,res) ->
    @response.contentType 'text/json'
    @response.sendfile 'public/seedConcertData.json'

port = if process.env.PORT > 0 then process.env.PORT else 3000
tbApp.app.listen port
console.log "starting on port # #{port}"
