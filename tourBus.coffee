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
  modifiedDate: Date
  author: {
    authorID: {type: String, index: {unique: false}}
    authorDisplayName: String
    imageURI: String
  }
  artistID: Number #just because I need it here
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
  modifiedDate: {type: Date, index: {unique: false}}
  authorDisplayName: String
  twitterHandle: String
  imageURI: String
  ratingCount: Number
  metroAreaDisplayName: String #todo: update this with rating
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
  modifiedDate: {type: Date, index: {unique: false}}
}

VenueDef = {
  venueID: {type: Number, index: {unique: false}}
  location: [Number, Number]
  displayName: {type: String, index: {unique: false}}
  metroAreaID: {type: Number, index: {unique: false}}
  metroAreaDisplayName: String
  uri: String
}

FeedItemSchema = new Schema {
  ratingID: String #maybe none
  comment: String #maybe none
  modifiedDate: {type: Date, index: {unique: false}}
  author: {
    authorID: String
    authorDisplayName: String
    imageURI: String
  }
}
FeedItemSchema.virtual('feedItemID').get ->
  return this._id


ConcertSchema = new Schema {
  modifiedDate: {type: Date, index: {unique: false}}
  concertID : {type: Number, index: { unique: true } }
  headliner : {type: String}
  imageURI: String
  openers: String
  rating: Number
  startDateTime: {type: Date, index: {unique: false}}
  uri : String
  venue : VenueDef
  artists: [{uri: String, imageURI: String, displayName: String, artistID: {type: Number, index: {unique: false}}}]
  feedItems: [FeedItemSchema]
  authorsCheckedIn: [{artistID: Number}]
}
ConcertSchema.index { 'venue.location': '2d' }

Author = mongoose.model 'Author', AuthorSchema
Artist = mongoose.model 'Artist', ArtistSchema
Rating = mongoose.model 'Artist.ratings', RatingSchema
Area = mongoose.model 'Area', AreaSchema
AreaLocation = mongoose.model 'Area.locations', AreaLocationSchema
FeedItem = mongoose.model 'Concert.feedItems', FeedItemSchema
Concert = mongoose.model 'Concert', ConcertSchema

tbApp = require('zappa').app ->
  mongoose.connect(secrets.mongoDBConnectURLSecret)
  @use 'bodyParser', 'static', 'cookies', 'cookieparser'
  
  @get '/': 'time to tour'

  @get '/apiv1/authors': 'not at REST'
  
  @get '/apiv1/authors/:id', (req, res) ->
    getAuthorAndAuthorsWithRatingsAndConcertsForRatingsWithAuthorID @params.id, (err, author, artistsWithRatings, concerts) =>
      console.log "got stuff for authorID #{@params.id} with err #{err}: artists ct: #{artistsWithRatings.length} concert ct: #{concerts.length}"
      if err?
        @response.send {}
      else
        @response.send {authors: [author], concerts: concerts, artists: artistsWithRatings}

  getAuthorAndAuthorsWithRatingsAndConcertsForRatingsWithAuthorID = (authorID, callback) -> #callback (err, author, artistsWithRatings, concertsForRatings)
    getAuthorWithIDAndAuthorizeToken authorID, null, (err, author, authorInfo, isAuthed) =>
      if author? == false || error?
        callback "error getAuthorAndRatings: #{err}"
        return
      else
        #here authorID it is a string-- intende?
        Artist.find {'ratings.author.authorID': "#{authorID}"}, null, null, (err, artists) =>
          if err?
            callback "fetch artists with author ratings err"
          else
            #todo: trim the artists reviewed here
            getConcertsRelevantToRatingsInArtistsWithAuthor artists, author, (err, concerts) =>
              if err?
                callback "fetch concerts relevant to artists and author err #{err}"
              else
                callback null, author, artists, concerts
  
  getConcertsRelevantToRatingsInArtistsWithAuthor = (artists, author, callback) -> #callback(err, concerts)
    authorID = author.authorID.toString()
    relevantConcertIDs = []
    for artist in artists
      for rating in artist.ratings
        if rating.author.authorID == authorID
          relevantConcertIDs.push rating.concertID
    #console.log "authorID #{authorID} has relevant concertIDs #{relevantConcertIDs}"
    Concert.find {concertID: {$in: relevantConcertIDs}}, {feedItems: 0}, null, (err, docs) =>
      callback err, docs

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
    lastUpdate = req.query.lastUpdateDate
    #see if we can do a fetch for ratings meeting a certain age criteria, in the future
    Concert.findOne {concertID: @params.id},{feedItems: {$slice:-20}}, (err, concert) =>
      if concert?
        getArtistsRelevantToConcerts [concert], (error, artists) =>
          @response.contentType 'text/json'
          @response.send {concerts: [concert], artists: artists}
      else
        @response.send {}

  @get '/apiv1/concerts/:id/feed', (req, res) ->
    lastUpdate = req.query.lastUpdateDate
    feedItemsConcertWithConcertID @params.id, lastUpdate, (error, concertWithFeed) =>
      console.log "sending relevant response for feedItems after error #{error}",  concertWithFeed
      if concertWithFeed
        @response.send concertWithFeed
      else
        @response.send {}
 
  @post '/apiv1/concerts/:id/feed', (req, res) ->
    lastUpdate = req.query.lastUpdateDate
    getAuthorWithIDAndAuthorizeToken req.body.authorID, null, (err, author,authorInfo, isAuthed) =>
      console.log "new feedItem from author#{ author.authorID}"
      if @params.id?
        Concert.update {concertID: @params.id}, {$push : {feedItems: {modifiedDate: new Date(), author: authorInfo, comment: req.body.comment} }}, 0, (err) =>
          if err?
            console.log "adding feedItem failed w/ error #{err}"
            @response.send {}
          else
            feedItemsConcertWithConcertID @params.id, lastUpdate, (error, concertWithFeed) =>
              console.log "sending relevant response for feedpost after error #{error}", concertWithFeed
              if concertWithFeed
                @response.send concertWithFeed
              else
                @response.send {}
      else
        @response.send {}
  
  @get '/apiv1/artists/:id', (req, res) ->
    if @params.id
      getArtistForIDGenerateIfNone @params.id, (error, artist) =>
        console.log "got artist for id #{@params.id} with error #{error}"
        if artist
          @response.send {artists: [artist]}
        else
          @response.send {}
    else
      @response.send {}

  
  @get '/apiv1/artists/:id/ratings', (req, res) ->
    if @params.id
      getArtistForIDGenerateIfNone @params.id, (error, artist) =>
        console.log "got artist for id #{@params.id} with error #{error}"
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
        console.log "post rating error #{err}", rating, artist, rating?.author
        if err? == false
          @response.send {artists: [artist]}
        else
          @response.send {}
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


  ## DONE FUNCTIONS ##
  getAuthorWithIDAndAuthorizeToken = (authorID, authorToken, callback) -> #callback(err, author, abreviatedInfo, isAuthorizedAuthor)
    authorObjID = null
    try
      authorObjID = mongoose.mongo.BSONPure.ObjectID.fromString(authorID)
    catch err
      callback "objID err: #{err} from id #{authorID}"
      return
    Author.findOne {_id: authorObjID}, (err, author) =>
      if err?
        callback err
      else
        authorInfo = {imageURI: author.imageURI, authorID: author.authorID.toString(), metroAreaDisplayName: author.metroAreaDisplayName, authorDisplayName: author.authorDisplayName, ratingCount: author.ratingCount}
        callback null, author, authorInfo, false
 
  feedItemsConcertWithConcertID = (concertID, lastUpdate, callback) -> #callback (error, concertWithFeed)
    if lastUpdate == 0 || lastUpdate? == false
      Concert.findOne {concertID: concertID},{concertID: 1, feedItems: {$slice:-40}}, (err, concert) =>
        if concert?
          concert.venue = undefined
          callback null, {concerts:[concert]}
        else
          callback "failed to get concert w. error #{err}"
    else
      Concert.findOne {concertID: concertID},{concertID: 1, feedItems:1}, (err, concert) =>
        if concert?
          feedItems = []
          for i in [concert.feedItems.length .. 0]
            if concert.feedItems?[i - 1]?.modifiedDate.getTime() < lastUpdate
              feedItems = concert.feedItems.slice(concert.feedItems.length - (i - 1))
              break
          response = {concerts:[{concertID:concert.concertID, feedItems:feedItems}]}
          callback null, response
        else
          callback "failed to get concert w. error #{err}"


  saveRatingWithPostData = (artistID, ratingPOST, callback) -> #(err, rating, artist) ->
    getArtistForIDGenerateIfNone artistID, (error, artist) =>
      #add review, recalculate rating, save
      if artist?
        Concert.findOne {concertID: ratingPOST.concertID}, (err, concert) =>
          if concert?

            getAuthorWithIDAndAuthorizeToken ratingPOST.authorID, null, (err, author, authorInfo, isAuthed) =>
              if author?
                console.log "authorID", author.authorID
                rating = new Rating {author: authorInfo, artistID: artistID, concertDate: concert.startDateTime, concertID: concert.concertID, overallRating: ratingPOST.overallRating, stagePRating: ratingPOST.stagePRating, soundQRating: ratingPOST.soundQRating, visualsEffectsRating: ratingPOST.visualsEffectsRating, reviewText: ratingPOST.reviewText,modifiedDate: new Date()}
                rating.ratingID = rating._id
                artist.ratings.push rating
                cumRating = 0
                for ratVal in artist.ratings
                  cumRating += parseInt(ratVal.overallRating)
                artist.averageRating = cumRating/ artist.ratings.length
                artist.ratingCount = artist.ratings.length
                
                toSet = { ratingCount: (author.ratingCount + 1) }
                if concert.venue?.metroAreaDisplayName? == true
                  toSet.metroAreaDisplayName = concert.venue?.metroAreaDisplayName
                Author.update {_id: author._id}, {$set: toSet},0, (err) ->
                  console.log "updated author w. display name #{author.displayName} to rating count #{author.ratingCount + 1 } with error #{err}"
  
                #perhaps we should replace this with push when we get high load, but it takes only a few hundred miliseconds-- I can't imagine too many places with that kind of volume
                artist.save (err, savedArt) =>
                  if err?
                    callback err
                  else
                    savedRatingID = savedArt?.ratings?.slice(-1)?[0]?.ratingID
                    ### #here I'm adding the artist's artistID
                    Artist.update {authorID: artistID, 'ratings._id': savedRatingID}, {$set: {"ratings.$.ratingID": savedRatingID}},0,0, (err) ->
                      if err?
                        console.log "error adding ratingID to artist id##{artistID} rating #{savedRatingID}"
                        callback err
                      else
                        console.log "should have updated artist with ratingID #{savedRatingID}"

                    savedArt?.ratings?[savedArt.ratings.length - 1 ]?.ratingID = savedRatingID
                    ###
                    callback null, rating, savedArt
                    
                    feedItem = new FeedItem {dateModified: new Date(), author: authorInfo, ratingID: savedRatingID}
                    console.log "saved artist, now posting feedItem with ratingID #{savedRatingID}"
                    Concert.update {concertID: concert.concertID},{$push: { feedItems: feedItem }},0, (err) ->
                      if err?
                        console.log "Error posting rating id #{savedRatingID} to feed #{err}"
                      else
                        console.log "posted rating id #{savedRatingID} to concert id #{concert.concertID} feed"
              else
                callback "author error: #{err}"
          else
            callback "concert error: #{err}"
      else
        callback "artist error: #{error}"

  getArtistForIDGenerateIfNone = (aID, callback) -> #callback (error, artist)
    id = parseInt(aID)
    Artist.find {artistID: id}, null, null, (err, docs) =>
      if docs?[0]? == false
        console.log "Generating new artist entry based on concert data with id #{id}"
        Concert.find {'artists.artistID': id}, {feedItems: 0}, {limit:1}, (err, docs) =>
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
      Concert.find {'venue.metroAreaID' : area.metroAreaID, startDateTime: {$gte: pastDate, $lt: futureDate}}, {feedItems: 0}, {limit:500, sort: {startDateTime: 1}}, (err, docs) =>
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
        #this concert will be rejected if it already exists because of unique concertIDs, this is needed funct
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
        savingVenue = {venueID: skVenue.id, displayName: skVenue.displayName, metroAreaDisplayName: skVenue.metroArea?.displayName, location: location, uri: skVenue.uri, metroAreaID: skVenue.metroArea?.id}

        savingConcert = new Concert {concertID: skEvent.id, uri: skEvent.uri, imageURI: concertImageURI,  headliner: artistHeadlining, openers: openers, artists: savingArtists, venue: savingVenue, startDateTime: dateTime, modifiedDate: new Date()}
        
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
      Concert.find {'venue.metroAreaID' : area.metroAreaID, startDateTime: {$gt: new Date()}}, {feedItems: 0}, {limit:500, sort: {startDateTime: 1}}, (err, docs) =>
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
                    errormsg = "no location found for #{location}"
                    console.log errormsg
                    callback null, errormsg

port = if process.env.PORT > 0 then process.env.PORT else 3000
tbApp.app.listen port
console.log "starting on port # #{port}"
