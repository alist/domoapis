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
  metroAreaID : {type: Number, index: {unique: true}}
  concertsLastUpdated : Date
}

#ratings use non-int IDs
RatingSchema = new Schema {
  creationDate: Date
  author: {
    authorID: {type: Number, index: {unique: false}}
    authorDisplayName: String
  }
  concertDate: {type: Date, index: {unique: false}}
  concertID: {type: Number, index: {unique: false}}
  overallRating: {type: Number, index: {unique: false}}
  stagePRating: Number
  soundQRating: Number
  visualsEffectsRating: Number
  reviewText: String
}
RatingSchema.virtual('ratingID').get ->
  return this._id

#authors use non-int ids
AuthorSchema = new Schema {
  authorDisplayName: String
  imageURI: String
  ratingCount: Number
}
AuthorSchema.virtual('authorID').get ->
  return this._id


ArtistSchema = new Schema {
  artistID: {type: Number, index: {unique: true }}
  displayName: String
  uri: String
  imageURI: String,
  averageRating: {type: Number, index: {unique: false}}
  ratings: [RatingSchema]
  ratingCount: Number
}

VenueDef = {
  venueID: {type: Number, index: {unique: false}}
  location: [Number, Number]
  displayName: {type: String, index: {unique: false}}
  metroAreaID: {type: Number, index: {unique: false}}
  uri: String
}

ConcertSchema = new Schema {
  concertID : {type: Number, index: { unique: true } }
  headliner : {type: String}
  imageURI: String
  openers: String
  rating: Number
  startDateTime: {type: Date, index: {unique: false}}
  uri : String
  venue : VenueDef
  artists: [{uri: String, imageURI: String, displayName: String, artistID: {type: Number, index: {unique: false}}}]
  authorsCheckedIn: [{artistID: Number}]
}
ConcertSchema.index { 'venue.location': '2d' }

Author = mongoose.model 'Author', AuthorSchema
Artist = mongoose.model 'Artist', ArtistSchema
Rating = mongoose.model 'Artist.ratings', RatingSchema
Area = mongoose.model 'Area', AreaSchema
AreaLocation = mongoose.model 'Area.locations', AreaLocationSchema
Concert = mongoose.model 'Concert', ConcertSchema

tbApp = require('zappa').app ->
  mongoose.connect(secrets.mongoDBConnectURLSecret)
  @use 'bodyParser', 'static', 'cookies', 'cookieparser'
  @get '/': 'time to tour'
  
  @get '/apiv1/concerts', (req,res) ->
    console.log req.query
    if req.query.longitude? and req.query.latitude?
      areaNearestLocation [req.query.longitude, req.query.latitude], (area, error) =>
        console.log error, area
        concertsNearArea area, (concerts, error) =>
          console.log "found concerts count# #{concerts?.length} near id #{area.metroAreaID} with error #{ error}"
          getArtistsRelevantToConcerts concerts, (error, artists) =>
            console.log "found rated artists count ##{artists?.length} for concerts with error #{error}"
            @response.contentType 'text/json'
            @response.send {concerts: concerts, artists: artists}
  
  @get '/apiv1/concerts/:id', (req, res) ->
    @response.send "gotcha id #{@params.id}, wokring on it!"

  @get '/apiv1/artists/:id', (req, res) ->
    if @params.id
      getArtistForIDGenerateIfNone @params.id, (error, artist) =>
        console.log error, artist
        if artist
          @response.send {artists: [artist]}
        else
          @response.send {}
    else
      @response.send {}

  
  @get '/apiv1/artists/:id/ratings', (req, res) ->
    if @params.id
      getArtistForIDGenerateIfNone @params.id, (error, artist) =>
        console.log error, artist
        if artist
          @response.send {artists: [artist]}
        else
          @response.send {}
    else
      @response.send {}

  @post '/apiv1/artists/:id/ratings', (req, res) ->
    console.log "new review from author#{ req.body.authorID}"
    if @params.id
      saveRatingWithPostData @params.id, req.body, (err, rating, artist) =>
        console.log err, rating, artist
        if err? == false
          @response.send {artists: [artist]}
        else
          @response.send {}

  saveRatingWithPostData = (artistID, ratingPOST, callback) -> #(err, rating, artist) ->
    getArtistForIDGenerateIfNone artistID, (error, artist) =>
      #add review, recalculate rating, save
      if artist?
        Concert.findOne {concertID: ratingPOST.concertID}, (err, concert) =>
          if concert?
            try
              authorObjID = mongoose.mongo.BSONPure.ObjectID.fromString(ratingPOST.authorID)
            catch err
              callback "objID err: #{err} from id #{ratingPOST.authorID}"
              return
            Author.findOne {_id: authorObjID}, (err, author) =>
              if author?
                authorInfo = {authorID: author.authorID, authorDisplayName: author.authorDisplayName, ratingCount: author.ratingCount}
                rating = new Rating {author: authorInfo, concertDate: concert.startDateTime, concertID: concert.concertID, overallRating: ratingPOST.overallRating, stagePRating: ratingPOST.stagePRating, soundQRating: ratingPOST.soundQRating, visualsEffectsRating: ratingPOST.visualsEffectsRating, reviewText: ratingPOST.reviewText,creationDate: new Date()}
                artist.ratings.push rating
                cumRating = 0
                for ratVal in artist.ratings
                  console.log ratVal
                  console.log "rating #{ratVal.overallRating}"
                  cumRating += parseInt(ratVal.overallRating)
                artist.averageRating = cumRating/ artist.ratings.length
                artist.ratingCount = artist.ratings.length
                
                artist.save (err) =>
                  if err?
                    callback err
                  else
                    callback null, rating, artist
              else
                callback "author error: #{err}"
          else
            callback "concert error: #{err}"
      else
        callback "artist error: #{error}"

  @get '/apiv1/happening', (req, res) ->
    console.log req.query
    if req.query.longitude? and req.query.latitude?
      getHappeningConcertsNearLocation [req.query.longitude, req.query.latitude], (concerts, error) =>
        console.log "found happening concerts count# #{concerts?.length} near loc #{req.query} with error #{ error}"
        getArtistsRelevantToConcerts concerts, (error, artists) =>
          console.log "found rated artists count ##{artists?.length} for concerts with error #{error}"
          @response.contentType 'text/json'
          @response.send {concerts: concerts, artists: artists}

  @get '/apiv1/happening/:id', (req, res) ->
    @response.send "happening id #{@params.id}, wokring on it!"

  getArtistForIDGenerateIfNone = (aID, callback) -> #callback (error, artist)
    id = parseInt(aID)
    Artist.find {artistID: id}, null, null, (err, docs) =>
      if docs?[0]? == false
        console.log "Generating new artist entry based on concert data with id #{id}"
        Concert.find {'artists.artistID': id}, null, {limit:1}, (err, docs) =>
          #not going to songkick means that if we ever delete old artists, we risk trashing a user's old data
          if docs?[0]?
            copyFromArtist = null
            for itArtist in docs[0].artists
              if itArtist.artistID == id
                copyFromArtist = itArtist
            console.log "instantiating artist from concert w/ subArtist", copyFromArtist
            artist = new Artist copyFromArtist
            artist.save (err) ->
              if err?
                callback err, null
              else
                callback null, artist
          else
            error = "could not create artist: no artist info ever encountered, or no concerts available for artistID #{id}"
            callback error, null
      else
        callback null, docs[0]

  getHappeningConcertsNearLocation = (location, callback) -> #callback (error, concerts)
    #maxDistanceRadial = 20 1/6378 #in radial coord km/radiusEarth *ONLY WORKS ON EARTH*
    #Concert.find {'venue.location' : {$nearSphere : location, $maxDistance: maxDistanceRadial} , startDateTime: {$gt: 0}}, null, {limit:100}, (err, docs) =>
    areaNearestLocation location, (area, error) =>
      if area.concertsLastUpdated? == false || new Date().getTime() - area.concertsLastUpdated.getTime() > 1000*60*60*24
        console.log "need to implement happeningConcerts updates"
        #but until later, don't need to update concerts here too...
      
      console.log error, area
      pastDate = new Date (new Date().getTime()-6*60*60*1000)
      futureDate = new Date (new Date().getTime()+6*60*60*1000)
      Concert.find {'venue.metroAreaID' : area.metroAreaID, startDateTime: {$gte: pastDate, $lt: futureDate}}, null, {limit:500, sort: {startDateTime: 1}}, (err, docs) =>
        if err?
          retErr =  "happening ConcertsNearLoc retrieval error #{err}"
          callback null, retErr
        else if docs?
          callback docs, null
        else
          retErr = "No happening concerts, but no retrieval errors"
          callback null, retErr

  #gets the Artists that match the artistIDs included in the Concert collection
  getArtistsRelevantToConcerts = (concerts, callback) -> #callback (error, artists)
    if concerts? == false
      err = "bad concerts data provided to get concerts"
      callback err, null
      return
    
    #grab artist IDs
    allArtistIDs = []
    for concert in concerts
      for artist in concert.artists
        allArtistIDs.push artist?.artistID
    
    Artist.find {artistID: {$in: allArtistIDs}}, null, null, (err, docs) =>
      callback err, docs

  #integrates the concerts updated from songkick with the existing server data 
  integrateEvents = (concerts, page, callback) -> #callback (error, page)
    if concerts? == false || concerts.length == 0
      err = "bad concerts data provided integration error"
      callback err, page
    
    else for concertIter in [0..concerts.length - 1]
      do (concertIter) ->
        skEvent = concerts[concertIter]
        if skEvent? == false
          err = "messed up skevent ##{concertIter}..abort"
          callback err, page
          return
        #this concert will be rejected if it already exists because of unique concertIDs, this is needed funct.!
        artists = skEvent.performance
        artistHeadlining = artists?[0]?.displayName
        
        if artistHeadlining? == false || artistHeadlining == ""
          err = "no artists for skevent ##{concertIter} on page ##{page}"
          return

        if artists.length > 1
          openers = ""
          numbersOfArtists = artists.length
          for artIt in [1..artists.length - 1]
            openers = openers.concat "#{artists[artIt]?.displayName} "
        
        savingArtists = []
        for artistB in artists
          artist = artistB.artist
          artistImageURI = "http://topimage.herokuapp.com/#{artist.displayName}"
          artistImageURI = artistImageURI.replace /\ /g, "-"
          savingArtists.push {displayName: artist.displayName, uri: artist.uri, imageURI: artistImageURI, artistID: artist.id}

        skVenue = skEvent.venue
        concertImageURI = "http://topimage.herokuapp.com/#{artistHeadlining}"
        concertImageURI = concertImageURI.replace /\ /g, "-"

        if skVenue.lng? && skVenue.lat?
          location = [skVenue.lng, skVenue.lat]

        dateTime = skEvent.start?.datetime
        if dateTime? == false
          dateTime = skEvent.start?.date
        savingVenue = {venueID: skVenue.id, displayName: skVenue.displayName, location: location, uri: skVenue.uri, metroAreaID: skVenue.metroArea?.id}

        savingConcert = new Concert {concertID: skEvent.id, uri: skEvent.uri, imageURI: concertImageURI,  headliner: artistHeadlining, openers: openers, artists: savingArtists, venue: savingVenue, startDateTime: dateTime}
        
        if concertIter == concerts.length - 1
          savingConcert.save (err) ->
            if err?
              console.log "noting save error obj# #{concertIter} for page # #{page}, last obj"
            callback null, page
        else
          savingConcert.save (err) ->
            if err?
              console.log "noting save error #{err} for obj# #{concertIter} for page # #{page}"
              #console.log err
  
  #get concerts for area (wherein we update from server as necessary)
  concertsNearArea = (area, callback) -> #callback (concerts, error)
    if area.concertsLastUpdated? == false || new Date().getTime() - area.concertsLastUpdated.getTime() > 1000*60*60*24
      console.log "Updating concerts for metroAreaID #{area.metroAreaID} beginning #{new Date()}"
      requestURL = "https://api.songkick.com/api/3.0/metro_areas/#{area.metroAreaID}/calendar.json?apikey=B7tlwR9tyOXNG2qw"
      console.log requestURL
      request requestURL, (error, response, body) ->
       if response.statusCode == 200
          resObjects = JSON.parse body
          resPage = resObjects.resultsPage
          resCount =  resPage.totalEntries
          resPages = Math.ceil (resCount / resPage.perPage) #page 1 is first page, not zero.
          console.log resCount, resPage.totalEntries, resPages
          console.log "beginning fetch/integration of #{resPages} pages for metroAreaID #{area.metroAreaID}"
          
          firstEvents = resObjects?.resultsPage?.results?.event

          if resPages > 1
            integrateEvents firstEvents, 1, (error, page) ->
              console.log "integration error on page #{page} #{error}"
            
            for page in [2..resPages]
              do (page) ->
                requestURL = "https://api.songkick.com/api/3.0/metro_areas/#{area.metroAreaID}/calendar.json?apikey=B7tlwR9tyOXNG2qw&page=#{page}"
                console.log requestURL
                request requestURL, (error, response, body) =>
                  pageIn = page
                  if response.statusCode == 200
                    resObjects = JSON.parse body
                    resPage = resObjects.resultsPage
                    events = resPage?.results?.event
                    console.log "#{events?.length} events to integrate for page #{pageIn}"
                    if page == resPages
                      integrateEvents events, resPages, (error, page) ->
                        console.log "integrated page# #{page}"
                        if error?
                          console.log "integration error on page #{page} #{error}, metroAreaID #{area.metroAreaID} update aborted"
                        else
                          console.log "finished updating concerts for metroAreaID #{area.metroAreaID} @ #{new Date()}"
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
            integrateEvents firstEvents, 1, (error, page) ->
              if error?
                console.log "integration error on page #{page} #{error}, metroAreaID #{area.metroAreaID} update aborted"
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
      Concert.find {'venue.metroAreaID' : area.metroAreaID, startDateTime: {$gt: 0}}, null, {limit:500, sort: {startDateTime: 1}}, (err, docs) =>
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
      Area.find { "locations.location" : { $nearSphere : location, $maxDistance : maxDistanceRadial }}, (err, docs) =>
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
          requestURL = "https://api.songkick.com/api/3.0/search/locations.json?apikey=B7tlwR9tyOXNG2qw&location=geo:#{location[1]},#{location[0]}"
          console.log requestURL
          request requestURL, (error,response,body) =>
            
            if response.statusCode == 200
              resObjects = JSON.parse body
              firstArea = resObjects?.resultsPage?.results?.location?[0]?.metroArea
              console.log firstArea
              if firstArea? == false
                callback null, "no area returned error"
                return
              
              newLocation = new AreaLocation {location: location}
              Area.findOne { "metroAreaID" : firstArea.id}, (err, oldArea) =>
                if oldArea?
                  oldArea.locations.splice 0,0, newLocation
                  areaAtLocation = oldArea
                else
                  newArea = new Area {locations: [newLocation], metroAreaID: firstArea.id}
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
