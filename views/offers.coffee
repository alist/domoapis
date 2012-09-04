@title = 'Make Offer'
@stylesheets = ['/css/style','/css/bootstrap.min']
@localScripts = ['/js/bootstrap.min','/js/jquery.min']

coffeescript ->
  @window.newOfferPressed = (offerPersonName) ->
    if $('#newOfferPersonTextInput').val() == ""
      return
    (jQuery.ajax "/apiv1/newOffer?name=#{$('#newOfferPersonTextInput').val()}").fail((data) -> alert("whoops an error happened... #{data}")).done (respData) ->
      
      console.log respData
      newOffer = respData?.offer
      
      window.displayOffer newOffer
  
  @window.displayOffer = (offer) ->
    shortenLink =  "<a class='shortenShare' href='https://bitly.com/#{offer.offerURL}'>Shorten</a>"
    recindButton = "<a class='btn' href='/offers/#{offer._id.toString()}/recind'>X</a>"
    insertRow = "<tr><td>#{offer.createDate}</td><td>#{offer.forPerson}</td><td>#{offer.offerURL + ' ' + shortenLink}</td><td>#{recindButton}</td></tr>"
    $('#offerTable > tbody > tr:first').after insertRow
  
p ->
  div 'input-append', ->
    input 'span2', {id: 'newOfferPersonTextInput', style: 'height: 30px', size: '16', type: 'text', placeholder: 'Friend\'s Name'}, ->
    a 'btn', {href:"javascript:void(0)", onclick: 'window.newOfferPressed.apply()'}, -> 'New Offer!'
  span 'help-inline', ->
    'Offers represent your willingness to help a friend with anything they need. Make sure you mean it.'

table 'table', {id: 'offerTable'}, ->
  th 'Date'
  th 'Person'
  th 'URL'
  th 'Recind'
  if @offers? then for offer in  @offers.slice(0).reverse()
    tr ->
      td -> offer.createDate?.toString()
      td offer.forPerson
      td ->
        text offer.offerURL + " "
        a 'shortenShare', {href:"https://bitly.com/#{offer.offerURL}"}, -> 'Shorten'
      td ->
        a 'btn', {href:"/offers/#{offer._id.toString()}/recind"}, -> 'X'


