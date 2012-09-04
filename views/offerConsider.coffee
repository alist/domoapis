@title = 'Consider Offer'
@stylesheets = ['/css/style','/css/bootstrap.min']
@localScripts = ['/js/bootstrap.min','/js/jquery.min']

div 'offerProposal', ->
  div 'offereeImage', {style:"background-image: url('#{@offeree.imageURI}')"}, ->
  div 'offerInfoText', ->
    p -> "You're appreciated. #{@offeree?.authorDisplayName} is offering to help you whenever you need anything. This could be for anything from cooking dinner to picking you up from the airport."
    p -> "If you accept, #{@offeree?.authorDisplayName} will be added to the list of friends you can send messages to at once. Your decision is entirely secret whether you accept or ignore."
    a 'btn', {href:"/offers/#{@offer?._id}/accept"}, -> 'Accept'
    text ' '
    a 'btn', {href:"/"}, -> 'Ignore'
 
