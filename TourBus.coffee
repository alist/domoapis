secrets = require ('./secrets')
request = require 'request'
mongoose     = require('mongoose')
Schema = mongoose.Schema

ObjectId = mongoose.SchemaTypes.ObjectId

AreaLocationSchema = new Schema {
  location: [Number, Number]
}

AreaLocationSchema.index { location: '2d' }

AreaSchema = new Schema {
  locations : [AreaLocationSchema] #long, lat
  metroID : {type: Number, index: {unique: true}}
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
  @use 'bodyparser', 'static', 'cookies', 'cookieparser'
  @get '/': 'time to tour'
  
  @get '/concerts', (req,res) ->
    console.log req.query
    if req.query.longitude? and req.query.latitude?
      areaNearestLocation req.query, (area, error) =>
        console.log error, area
        if area.concertsLastUpdated? == false || new Date().getTime() - area.concertsLastUpdated.getTime() > 1000*60*60*24
          console.log "updating concerts at metroID #{area.metroID}"
    @response.contentType 'text/json'
    @response.sendfile 'public/seedConcertData.json'

  #gets nearest location, or asks songkick for it
  areaNearestLocation = (location, callback) -> #callback (area, error)
    maxDistanceRadial = 5 * 1/6378 #in radial coord km/radiusEarth *ONLY WORKS ON EARTH*
    areaAtLocation = null
    if location?
      Area.find { "locations.location" : { $nearSphere : [location.longitude,location.latitude], $maxDistance : maxDistanceRadial }}, (err, docs) =>
        if err?
          console.log "error on area location lookup #{err}"
          callback err, null
          return
        if docs?[0]?
          console.log docs
          areaAtLocation = docs[0]
          callback areaAtLocation, null
    
        #songkick request
        if areaAtLocation == null
          requestURL = "https://api.songkick.com/api/3.0/search/locations.json?apikey=B7tlwR9tyOXNG2qw&location=geo:#{location.latitude},#{location.longitude}"
          console.log requestURL
          request requestURL, (error,response,body) =>
            
            if response.statusCode == 200
              resObjects = JSON.parse body
              firstArea = resObjects?.resultsPage?.results?.location?[0]?.metroArea
              console.log firstArea
              
              newLocation = new AreaLocation {location: [location.longitude, location.latitude]}
              Area.findOne { "metroID" : firstArea.id}, (err, oldArea) =>
                if oldArea?
                  oldArea.locations.splice 0,0, newLocation
                  areaAtLocation = oldArea
                else
                  newArea = new Area {locations: [newLocation], metroID: firstArea.id}
                  areaAtLocation = newArea
                
                areaAtLocation.save (error) =>
                  if error? == false
                    callback areaAtLocation, null
                  else
                    console.log error
          
                  if areaAtLocation == null
                    errorMsg = "no location found for #{location}"
                    console.log errorMsg
                    callback null, errorMsg

port = if process.env.PORT > 0 then process.env.PORT else 3000
tbApp.app.listen port
console.log "starting on port # #{port}"
