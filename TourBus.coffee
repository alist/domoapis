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

VenueDef = {
  venueID: {type: Number, index: {unique: false}}
  location: [Number, Number]
  venueDisplayName: {type: String, index: {unique: false}}
  metroID: {type: Number, index: {unique: false}}
  uri: String
}

ConcertSchema = new Schema {
  concertID : {type: Number, index: { unique: true } }
  headliner : {type: String}
  imageURI: String
  openers: String
  rating: Number
  startDateTime: Date
  uri : String
  venue : VenueDef
  artistsIDs: [{type: Number, index: {unique: false }}]
  metroID : {type: Number, index: {unique: false }}
}
ConcertSchema.index { 'venue.location': '2d' }

Area = mongoose.model 'Area', AreaSchema
AreaLocation = mongoose.model 'Area.locations', AreaLocationSchema
Concert = mongoose.model 'Concert', ConcertSchema

tbApp = require('zappa').app ->
  mongoose.connect(secrets.mongoDBConnectURLSecret)
  @use 'bodyparser', 'static', 'cookies', 'cookieparser'
  @get '/': 'time to tour'
  
  @get '/concerts', (req,res) ->
    console.log req.query
    if req.query.longitude? and req.query.latitude?
      areaNearestLocation req.query, (area, error) =>
        console.log error, area
        concertsNearArea area, (concerts, error) =>
          console.log concerts, error
    @response.contentType 'text/json'
    @response.sendfile 'public/seedConcertData.json'

 
  #integrates the concerts updated from songkick with the existing server data 
  integrateEvents = (concerts, page, callback) -> #callback (error, page)
    if concerts? == false || concerts.length == 0
      err = "bad concerts data provided integration error"
      callback err, page
    
    else for concertIter in [0..concerts.length()-1]
      skEvent = concerts[concertIter]
      if skEvent? == false
        err = "messed up skevent ##{concertIter}..abort"
        callback err, page
        return
      #this concert will be rejected if it already exists because of unique concertIDs, this is needed!
      artists = skEvent.performance
      artistsIDs = []
      for artist in artists
        artistsIDs.push artist.id
      artistHeadlining = artists?[0]?.displayName
      if artists.length > 1
        openers = ""
        for artIt in [1..artists.length]
          openers = openers.concat "#{artists[artIt]?.displayname} "
      
      location = skEvent.location
      skVenue = skEvent.venue

      savingVenue = {venueID: skVenue.id, displayname: skVenue.displayName, location: [skVenue.lng, skVenue.lat], uri: skVenue.uri, metroID: skVenue.metroArea?.id}

      savingConcert = new Concert {concertID: skEvent.id, uri: skEvent.uri, imageURI: "http://topimage.herokuapp.com/#{}", headliner: artistHeadling, openers: openers, artistsIDs: artistsIDs, venue: savingVenue, startDateTime: skEvent.start?.datetime}
      
      if concertIter == concerts.length()
        savingConcert.save (err) ->
          if err?
            console.log "noting save error obj# #{concertIter} for page # #{page}, last obj"
          callback null, page
      else
        savingConcert.save (err) ->
          if err?
            console.log "noting save error obj# #{concertIter} for page # #{page}"
  
  #get concerts for area (wherein we update from server as necessary)
  concertsNearArea = (area, callback) -> #callback (concerts, error)
    if area.concertsLastUpdated? == false || new Date().getTime() - area.concertsLastUpdated.getTime() > 1000*60*60*24
      console.log "Updating concerts for metroID #{area.metroID}"
      requestURL = "https://api.songkick.com/api/3.0/metro_areas/#{area.metroID}/calendar.json?apikey=B7tlwR9tyOXNG2qw"
      console.log requestURL
      request requestURL, (error, response, body) ->
       if response.statusCode == 200
          resObjects = JSON.parse body
          resPage = resObjects.resultsPage
          resCount =  resPage.totalEntries
          resPages = Math.ceil (resCount / resPage.perPage) #page 1 is first page, not zero.
          console.log resCount, resPage.totatlEntries, resPages
          console.log "beginning fetch/integration of #{resPages} pages for metroID #{area.metroID}"
          
          events = resPage.results

          if resPages > 1
            integrateEvents events, 1, (error, page) ->
              console.log "integration error on page #{page} #{error}"
            
            for page in [2..resPages]
              requestURL = "https://api.songkick.com/api/3.0/metro_areas/#{area.metroID}/calendar.json?apikey=B7tlwR9tyOXNG2qw&page=#{page}"
              console.log requestURL
              request requestURL, (error, response, body) ->
                if response.statusCode == 200
                  resObjects = JSON.parse body
                  resPage = resObjects.resultsPage
                  events = resPage.results
                  if page == resPages
                    integrateEvents events, resPages, (error, page) ->
                      if error?
                        console.log "integration error on page #{page} #{error}, metroID #{area.metroID} update aborted"
                      else
                        area.concertsLastUpdated = new Date()
                        area.save (error) =>
                          if error?
                            retErr = "updating concertslastupdated error #{error}"
                            callback null, retErr
                          else
                            concertsNearArea area, callback #we'll just get all recursive on it!

                  else
                    integrateEvents events, page, (error, page) ->
                      if error?
                        console.log "integration error on page #{page} #{error}"
                    
          else if resPages == 1
            integrateEvents events, 1, (error, page) ->
              if error?
                console.log "integration error on page #{page} #{error}, metroID #{area.metroID} update aborted"
              else
                area.concertsLastUpdated = new Date()
                area.save (error) =>
                  if error?
                    retErr = "updating concertslastupdated error #{error}"
                    callback null, retErr
                  else
                    concertsNearArea area, callback #we'll just get all recursive on it!
          
       else
         retErr = "bad response for URL #{requestURL}"
         callback null, retErr
    else
      Concerts.find {metroID : area.metroID}, (err, docs) =>
        if err?
          retErr =  "ConcertsNearArea retrieval error #{err}"
          callback null, retErr
        else if docs?
          callback docs, null
        else
          retErr = "No concerts, but no retrieval errors"
          callback null, retErr

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
