secrets = require ('./secrets')
request = require 'request'
mongoose     = require('mongoose')
Schema = mongoose.Schema

ObjectId = mongoose.SchemaTypes.ObjectId

AreaSchema = new Schema {
  location: [Number, Number]
  displayName:  String
  concertsLastUpdated : Date
}
AreaSchema.index { location: '2d' }

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
  authorID: {type: String, required: true, index: {unique: true}}
  accessToken: {type: String}
  facebookID: {type: Number, index: {unique: true}}
}

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

VenueDef = {
  venueID: {type: Number, index: {unique: false}, required: true}
  location: [Number, Number]
  latitude: Number
  longitude: Number
  displayName: {type: String, index: {unique: false}}
  metroAreaID: {type: Number, index: {unique: false}}
  metroAreaDisplayName: String
  uri: String
}

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
  authorsCheckedIn: [{
    authorID: {type: String, index: {unique: false}}
    authorDisplayName: String
    imageURI: String
  }]
}
ConcertSchema.index { 'venue.location': '2d' }

Author = mongoose.model 'Author', AuthorSchema
Artist = mongoose.model 'Artist', ArtistSchema
Rating = mongoose.model 'Artist.ratings', RatingSchema
Area = mongoose.model 'Area', AreaSchema
FeedItem = mongoose.model 'Concert.feedItems', FeedItemSchema
Concert = mongoose.model 'Concert', ConcertSchema

`Array.prototype.unique = function() {    var o = {}, i, l = this.length, r = [];    for(i=0; i<l;i+=1) o[this[i]] = this[i];    for(i in o) r.push(o[i]);    return r;};`

tbApp = require('zappa').app ->
  mongoose.connect(secrets.mongoDBConnectURLSecret)
  @use 'bodyParser', 'static', 'cookies', 'cookieparser'

  @get '/': -> @render index: {}
      
  @get '/faq': -> @render faq: {}

  @get '/contact': -> @render contact: {}
  
  @get '/ratings/:id': ->
    objID = null
    try
      objID = mongoose.mongo.BSONPure.ObjectID.fromString(@params.id)
    catch err
      console.log "objID err: #{err} from publicid #{@params.id}"
      @redirect '/'
      return
    
    Artist.findOne {'ratings._id': objID}, null, (error, artist) =>
      if error? || artist? == false
        console.log "failed fetch artists with rating id #{objID} with error #{error}"
        @redirect '/'
      else
        theRating = null
        for rating in artist?.ratings
          if rating._id.toString() == objID.toString()
            theRating = rating
            break
        authID = theRating?.author?.authorID
        Author.findOne {authorID: authID},{}, (err, author) =>
          if author? == false
            console.log "no author found with id #{authID}"
            author = theRating?.author
          Concert.findOne {concertID: theRating?.concertID}, null, (cErr, concert) =>
            if concert? == false
              concert = null
            @render rating: {artist: artist, rating: theRating, author: author, concert: concert}

  @get '/apiv1/authors': 'not at REST'

  @get '/apiv1/authors/login', (req, res) ->
    fbID = req.query.facebookID
    accessToken = req.query.facebookAccessToken
    if accessToken? == false
      accessToken = req.query.accessToken
    twitterHandle = req.query.twitterHandle
    
    authCurrentAuthorWithIDAndToken fbID, accessToken, (err, author,authorInfo) =>
      console.log "auth or create for id #{fbID} finished with err #{err}"
      if err?
        @response.send {}
      else
        if twitterHandle?
          author.twitterHandle =  twitterHandle
          author.save (err, savedAuthor) =>
            console.log "did set twitter handle for authorID #{author.authorID}"
            @response.send {authors: [author]}
        else
          @response.send {authors: [author]}
 
  @get '/apiv1/authors/:id', (req, res) ->
    getAuthorAndAuthorsWithRatingsAndConcertsForRatingsWithAuthorID @params.id, (err, author, artistsWithRatings, concerts) =>
      console.log "got stuff for authorID #{@params.id} with err #{err}: artists ct: #{artistsWithRatings?.length} concert ct: #{concerts?.length}"
      if err?
        @response.send {}
      else
        @response.send {authors: [author], concerts: concerts, artists: artistsWithRatings}

  @get '/apiv1/concerts', (req,res) ->
    console.log req.query
    if req.query.longitude? and req.query.latitude?
      getConcertsNearLocation [parseFloat(req.query.longitude),parseFloat( req.query.latitude)], (error, concerts) =>
        console.log "found concerts count# #{concerts?.length} near with error #{ error}"
        if error?
          @response.contentType 'text/json'
          @response.send {}
          return
        else
          getArtistsRelevantToConcerts concerts, (error, artists) =>
            console.log "found rated artists count ##{artists?.length} for concerts with error #{error}"
            @response.contentType 'text/json'
            @response.send {concerts: concerts, artists: artists}
    else
      @response.contentType 'text/json'
      @response.send {}
     
  @get '/apiv1/concerts/:id', (req, res) ->
    lastUpdate = req.query.lastUpdateDate
    fbID = req.query.authorID
    accessToken = req.query.accessToken
    checkInRequest = req.query.checkIn
    processCheckinRequest fbID, accessToken, @params.id, checkInRequest, (didCheckIn, concert) =>
      console.log "did checkin #{didCheckIn} for id #{@params.id}"
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
    fbID = req.query.authorID
    accessToken = req.query.accessToken
    authCurrentAuthorWithIDAndToken fbID, accessToken, (err, author,authorInfo) =>
      if @params.id? && err? == false
        console.log "new feedItem from author#{ author.authorID}"
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
    fbID = req.query.authorID
    accessToken = req.query.accessToken
    authCurrentAuthorWithIDAndToken fbID, accessToken, (err, author,authorInfo) =>
      if err? == false
        console.log "new review from author#{ req.body.authorID}"
        if @params.id
          saveRatingWithPostData @params.id, req.body, (err, rating, artist) =>
            console.log "post rating error #{err}", rating, artist, rating?.author
            if err? == false
              @response.send {artists: [artist]}
            else
              @response.send {}
      else
        @response.send {}

  @get '/apiv1/happening', (req, res) ->
    console.log req.query
    if req.query.longitude? and req.query.latitude?
      getHappeningConcertsNearLocation [parseFloat(req.query.longitude),parseFloat(req.query.latitude)], (concerts, error) =>
        console.log "found happening concerts count# #{concerts?.length} near loc #{req.query} with error #{ error}"
        getArtistsRelevantToConcerts concerts, (error, artists) =>
          console.log "found rated artists count ##{artists?.length} for concerts with error #{error}"
          @response.contentType 'text/json'
          @response.send {concerts: concerts, artists: artists}

  @get '/apiv1/happening/:id', (req, res) ->
    @response.send "happening id #{@params.id}, wokring on it!"

  @get '/:id': ->
    @redirect "/ratings/#{@params.id}"
 
  ## DONE FUNCTIONS ##
  processCheckinRequest = (fbID, accessToken, concertID, wantsCheckIn, callback) -> #callback (didCheckIn, concert)
    Concert.findOne {concertID: concertID},{feedItems: {$slice:-20}}, (err, concert) =>
      if concert? == false
        callback false
      else
        authCurrentAuthorWithIDAndToken fbID, accessToken, (err, author,authorInfo) =>
          if err?
            callback false, concert
          else
            if wantsCheckIn?
              Concert.update {"concertID": concertID}, {$push : {authorsCheckedIn: authorInfo}}, 0, (err) =>
                if err?
                  console.log "adding checkInAuthor failed w/ error #{err}"
                  callback false, concert
                else
                  console.log "added checkedIn author id# #{fbID}"
                  Concert.findOne {concertID: concertID},{feedItems: {$slice:-20}}, (err, concertRefresh) =>
                    if concertRefresh?
                      callback true, concertRefresh
                    else
                      console.log "critical: deleted concert during check-in"
                      callback true, concert
            else
              callback false, concert

  getAuthorAndAuthorsWithRatingsAndConcertsForRatingsWithAuthorID = (authorID, callback) -> #callback (err, author, artistsWithRatings, concertsForRatings)
    getAuthorWithID authorID, (err, author, authorInfo) =>
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

  authCurrentAuthorWithIDAndToken = (authorID, token, callback) -> #callback(err, author, abreviatedInfo)
    if token? == false
      callback "no token included for authorID auth id##{authorID}"
      return

    Author.findOne {authorID: authorID},{}, (err, author) =>
      if err? || author? == false
        authUserWithFacebookOfIDAndToken authorID, token, (err, fbUserID, fbResponse) =>
          if err?
            callback "could not find author with pre-id #{authorID} with fbID #{fbUserID} with error #{err}"
          else
            if authorID? == false #if prior authorID was unknown by request, we'll check to see if we have a match right now-- recursion!
              console.log "using recursion to determine if fbUserID exists, now that we know it's #{fbUserID}"
              authCurrentAuthorWithIDAndToken fbUserID, token, callback
            else
              imgURI = "https://graph.facebook.com/#{fbUserID}/picture?type=large&return_ssl_resources=1"
              authorInfo = {authorID: fbUserID, facebookID: fbUserID, accessToken: token, imageURI: imgURI, authorDisplayName: fbResponse.name, modifiedDate: new Date()}
              authorInfo.metroAreaDisplayName = fbResponse.location?.name
              newAuthor = new Author authorInfo
              console.log "create the author! with info #{authorInfo}"
              newAuthor.save (err, savedAuthor) =>
                if err?
                  callback "error for author save #{err} with info #{authorInfo} savedAuthor: #{savedAuthor}"
                else
                  console.log "saved new author #{savedAuthor} with info #{authorInfo}, using recursion for auth"
                  authCurrentAuthorWithIDAndToken fbUserID, token, callback
      else
        if author.accessToken? == false
          callback "no valid token for user id #{authorID}"
        else
          if author.accessToken? != token
            author.accessToken = token
            author.save (err) =>
              console.log "updated token for authorID #{author.authorID} w. error #{err}"
          authorInfo = {imageURI: author.imageURI, authorID: author.authorID.toString(), metroAreaDisplayName: author.metroAreaDisplayName, authorDisplayName: author.authorDisplayName, ratingCount: parseInt(author.ratingCount)}
          callback null, author, authorInfo
  
  authUserWithFacebookOfIDAndToken = (fbID, fbToken, callback) -> #callback (err, fbUserID, responseData) #with err if invalid token
    if fbToken? == false
      callback "missing token for fb req"
      return
    requestURL = "https://graph.facebook.com/me?access_token=#{fbToken}"
    console.log "doing request to fb with url: #{requestURL}"
    request requestURL, (error, response, body) ->
      if error? || response.statusCode != 200
        callback "fbreq err #{error} with code #{response.statusCode}"
        return
      resObjects = JSON.parse body
      if resObjects?.id != fbID
        console.log "fbreq mismatched fbID from req #{fbID} from server #{resObjects?.id}"
      if resObjects?.id? == false
        callback "no fbID returned for token #{fbToken}"
      else
        callback null, resObjects.id, resObjects

 
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

  getAuthorWithID = (authorID, callback) -> #callback(err, author, abreviatedInfo)
    Author.findOne {authorID: authorID},{accessToken:0, facebookID: 0}, (err, author) =>
      if err? || author? == false
        callback "could not find author of id #{authorID} with error #{err}"
      else
        authorInfo = {imageURI: author.imageURI, authorID: author.authorID.toString(), metroAreaDisplayName: author.metroAreaDisplayName, authorDisplayName: author.authorDisplayName, ratingCount: author.ratingCount}
        callback null, author, authorInfo
 
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

            getAuthorWithID ratingPOST.authorID, (err, author, authorInfo) =>
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
                
                ratings = if author.ratingCount then author.ratingCount + 1 else 1
                toSet = { ratingCount: ratings }
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
                    
                    feedItem = new FeedItem {modifiedDate: new Date(), author: authorInfo, ratingID: savedRatingID}
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
    radialKM = 1/6378 #in radial coord km/radiusEarth *ONLY WORKS ON EARTH*
    
    pastDate = new Date (new Date().getTime()-6*60*60*1000)
    futureDate = new Date (new Date().getTime()+6*60*60*1000)
    Concert.find {"venue.location": {$nearSphere: location, $maxDistance: radialKM * 50}, startDateTime: {$gte: pastDate, $lt: futureDate}}, {feedItems: 0}, {limit:200}, (err, concerts) =>
      if err?
        retErr =  "happening ConcertsNearLoc retrieval error #{err}"
        callback null, retErr
      else if concerts?
        callback concerts, null
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
      if concert.artists? == false
        console.log concert
      for artist in concert.artists
        allArtistIDs.push artist?.artistID
    
    Artist.find {artistID: {$in: allArtistIDs}}, null, null, (err, docs) =>
      callback err, docs

  #integrates the concerts updated from songkick with the existing server data 
  integrateEvents = (concerts, page, defaultLocation, callback) -> #callback (error, page)
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

        openers = ""
        if artists.length > 1
          numbersOfArtists = artists.length
          for artIt in [1..artists.length - 1]
            if artIt == 1
              openers = artists[artIt]?.displayName
            else
              openers = openers.concat ", #{artists[artIt]?.displayName}"

        savingArtists = []
        for artistB in artists
          artist = artistB.artist
          artistImageURI = "http://topimage.herokuapp.com/#{artist.displayName} music"
          artistImageURI = artistImageURI.replace /\ /g, "-"
          savingArtists.push {displayName: artist.displayName, uri: artist.uri, imageURI: artistImageURI, artistID: artist.id}

        skVenue = skEvent.venue
        concertImageURI = "http://topimage.herokuapp.com/#{artistHeadlining} album"
        concertImageURI = concertImageURI.replace /\ /g, "-"

        if skVenue.lng? && skVenue.lat?
          location = [skVenue.lng, skVenue.lat]

        dateTime = skEvent.start?.datetime
        if dateTime? == false
          dateTime = skEvent.start?.date

        if skVenue?.id? == false
          console.log "no venueID for concertID #{skEvent?.id} -- skip obj# #{concertIter} of #{ (concerts.length) - 1} for page # #{page}"
          return #returns through do

        savingVenue = {venueID: skVenue.id, displayName: skVenue.displayName, metroAreaDisplayName: skVenue.metroArea?.displayName, uri: skVenue.uri, metroAreaID: skVenue.metroArea?.id}
        if skVenue.lng? && skVenue.lat?
          savingVenue.longitude = skVenue.lng
          savingVenue.latitude = skVenue.lat
          savingVenue.location = location
        else
          savingVenue.longitude = defaultLocation[0]
          savingVenue.latitude = defaultLocation[1]
          savingVenue.location = defaultLocation
          console.log "no location for concertID #{skEvent?.id}  -- setting default for obj# #{concertIter} of #{ (concerts.length) - 1} for page # #{page}"

        savingConcert = {concertID: skEvent.id, uri: skEvent.uri, imageURI: concertImageURI,  headliner: artistHeadlining, openers: openers, artists: savingArtists, venue: savingVenue, startDateTime: dateTime, modifiedDate: new Date()}
        
        Concert.update {concertID: skEvent.id},{$set: savingConcert}, {upsert: 1}, (err) ->
          if err?
            console.log "noting save error obj# #{concertIter} of #{ (concerts.length) - 1} for page # #{page}"
            console.log err, savingConcert
          if concertIter == concerts.length - 1
            callback null, page
  
  getConcertsNearLocation = (location, callback) -> #callback (err, concerts)
    radialKM = 1 * 1/6378 #in radial coord km/radiusEarth *ONLY WORKS ON EARTH*
    if location?
      query = { "location" : { $nearSphere : location, $maxDistance : radialKM * 5 }}
      Area.findOne query, (err, area) =>
        if err?
          console.log "error on area location lookup #{err} for query #{query}"
          callback err, null
          return
        if area? == false || area.concertsLastUpdated? == false || new Date().getTime() - area.concertsLastUpdated.getTime() > 1000*60*60*24
          metroAreaIDsAtLocation location, (error, firstArea, metroIDs) =>
            console.log "got #{metroIDs?.length} metro ids at loc with error #{error} and firstArea #{firstArea}"
            console.log metroIDs
            if metroIDs?.length > 0 && firstArea? == true
              updateConcertsWithMetroAreaIDs metroIDs, location, (err) =>
                console.log "did update metroAreaIDs with err #{err}"
                areaInfo = {concertsLastUpdated: new Date(), location: location, displayName: firstArea.displayName}
                criteria = { "location" : { $nearSphere : location, $maxDistance : radialKM * 5 }}
                #find the nearest 'area' and set it as updated, if it's within 5km, otherwise create one
                Area.update criteria, {$set: areaInfo},{upsert: 1}, (err) ->
                  if err?
                    returnErr = "error #{err} updating area #{area}"
                    callback returnErr
                  else
                    console.log "updated area, now recursion for get concerts"
                    getConcertsNearLocation location, callback
            else
              callback "no metroArea at location coord"
        else
          Concert.find {"venue.location": {$nearSphere: location, $maxDistance: radialKM * 50}, startDateTime: {$gt: new Date()}}, {feedItems: 0}, {limit:200, sort: {startDateTime: 1}}, (err, concerts) =>
            callback err, concerts

  updateConcertsWithMetroAreaIDs = (areaIDs, updateCentralLocation, callback) -> #callback (err)
    completionFunction = (metroAreaID, iterator, areaIDs,  theCallback) ->
      console.log "finished updating concerts for ##{iterator} of #{areaIDs.length} metroAreaIDs #{metroAreaID} @ #{new Date()}"
      if iterator == areaIDs.length
        console.log "last metroarea #{metroAreaID} updated"
        theCallback null
    iterator = 0
    for metroAreaID in areaIDs
      iterator = iterator+ 1
      do (metroAreaID, iterator) ->
        console.log "Updating concerts for metroAreaID #{metroAreaID} beginning #{new Date()}", metroAreaID
        requestURL = "https://api.songkick.com/api/3.0/metro_areas/#{metroAreaID}/calendar.json?apikey=B7tlwR9tyOXNG2qw"
        console.log requestURL
        request requestURL, (error, response, body) ->
          if response.statusCode == 200
            resObjects = JSON.parse body
            resPage = resObjects.resultsPage
            resCount =  resPage.totalEntries
            resPages = Math.ceil (resCount / resPage.perPage) #page 1 is first page, not zero.
            console.log resCount, resPage.totalEntries, resPages
            console.log "beginning fetch/integration of #{resPages} pages for metroAreaID #{metroAreaID}"
            
            firstEvents = resObjects?.resultsPage?.results?.event

            if resPages > 1
              integrateEvents firstEvents, 1, updateCentralLocation, (error, page) ->
                console.log "integration error on page #{page} #{error}"
              
              for page in [2..resPages]
                do (page) =>
                  requestURL = "https://api.songkick.com/api/3.0/metro_areas/#{metroAreaID}/calendar.json?apikey=B7tlwR9tyOXNG2qw&page=#{page}"
                  console.log requestURL
                  request requestURL, (error, response, body) =>
                    pageIn = page
                    if response.statusCode == 200
                      resObjects = JSON.parse body
                      resPage = resObjects.resultsPage
                      events = resPage?.results?.event
                      console.log "#{events?.length} events to integrate for page #{pageIn}"
                      if page == resPages
                        integrateEvents events, resPages, updateCentralLocation, (error, page) ->
                          console.log "integrated page# #{page}"
                          if error?
                            console.log "integration error on page #{page} #{error}, metroAreaID #{metroAreaID} update aborted"
                          completionFunction metroAreaID, iterator, areaIDs,  callback
                      else
                        integrateEvents events, page, updateCentralLocation, (error, page) ->
                          if error?
                            console.log "integration error on page #{page} #{error}"
                        
            else if resPages == 1
              integrateEvents firstEvents, 1, updateCentralLocation, (error, page) ->
                if error?
                  console.log "integration error on page #{page} #{error}, metroAreaID #{metroAreaID} update aborted"
                completionFunction metroAreaID, iterator, areaIDs,  callback
            else #respages == 0
              retErr = "no concerts nearby for URL: #{requestURL}"
              console.log retErr
              completionFunction metroAreaID, iterator, areaIDs,  callback
          else
            retErr = "bad response for URL #{requestURL}"
            console.log retErr
            completionFunction metroAreaID, iterator, areaIDs,  callback
 
  #gets all songkick metro ids at location
  metroAreaIDsAtLocation = (location, callback) -> #callback (error, firstArea, metroIDs)
    requestURL = "https://api.songkick.com/api/3.0/search/locations.json?apikey=B7tlwR9tyOXNG2qw&location=geo:#{location[1]},#{location[0]}"
    console.log requestURL
    request requestURL, (error,response,body) =>
      if response.statusCode == 200
        resObjects = JSON.parse body
        firstArea = resObjects?.resultsPage?.results?.location?[0]?.metroArea
        console.log firstArea
        if firstArea? == false
          callback "no area returned error"
          return
        metroIDs = []
        for itArea in resObjects?.resultsPage?.results?.location
          metroID = itArea?.metroArea?.id
          if metroID?
            metroIDs.push metroID
        metroIDs = metroIDs.unique()
        callback null, firstArea, metroIDs
      else
        callback "bad response for metroId lookup"

port = if process.env.PORT > 0 then process.env.PORT else 3000
tbApp.app.listen port
console.log "starting on port # #{port}"
