tbApp = require('zappa') ->
  @get '/': 'time to tour'

port = if process.env.PORT > 0 then process.env.PORT else 3000
tbApp.app.listen port
console.log "starting on port # #{port}"
