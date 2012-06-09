secrets = require ('./secrets')
mongoose     = require('mongoose')
mongooseAuth = require('mongoose-auth')
Schema = mongoose.Schema

ObjectId = mongoose.SchemaTypes.ObjectId

AreaLocationSchema = new Schema {
  location: [Number, Number]
}

AreaLocationSchema.index { location: '2d' }

AreaSchema = new Schema {
  locations : [AreaLocationSchema] #long, lat
  metroID : Number
  concertsLastUpdated : Date
}

ConcertsSchema = new Schema {
  concertID : {type: Number, index: { unique: true } }
  headliner : {type: String}
  imageURI: String
  openers: String
  rating: Number
  startDateTime: Date
  uri : String
  venueID : {type: Number, index: { unique: false }}
  artistsIDs: [{type: Number, index: {unique: false }}]
  metroID : {type: Number, index: {unique: false }}
}

Area = mongoose.model 'Area', AreaSchema
AreaLocation = mongoose.model 'Area.locations', AreaLocationSchema
Concerts = mongoose.model 'Concerts', ConcertsSchema

tbApp = require('zappa').app ->
  mongoose.connect(secrets.mongoDBConnectURLSecret)
  @use 'static', session: {secret: secrets.sessionSecret}
  @get '/': 'time to tour'
  
  @get '/concerts', (req,res) ->
    console.log req.query
    @response.contentType 'text/json'
    @response.sendfile 'public/seedConcertData.json'

port = if process.env.PORT > 0 then process.env.PORT else 3000
tbApp.app.listen port
console.log "starting on port # #{port}"
