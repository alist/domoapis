@title = 'Make Offer'
@stylesheets = ['/css/style','/css/bootstrap.min']
@localScripts = ['/js/bootstrap.min','/js/jquery.min']

coffeescript ->
  @window.newOfferPressed = (offerPersonName) ->
    insert = "<tr><td>#{$('#newOfferPersonTextInput').val()}</td></tr>"
    console.log insert
    $('#offerTable').append insert
p ->
  div 'input-append', ->
    input 'span2', {id: 'newOfferPersonTextInput', style: 'height: 30px', size: '16', type: 'text', placeholder: 'Person Name'}, ->
    a 'btn', {href:"javascript:void(0)", onclick: 'window.newOfferPressed.apply()'}, -> 'New Offer!'
  span 'help-inline', ->
    'Offers represent your willingness to help friend with anything they need'

table 'table', {id: 'offerTable'}, ->
  th 'Date'
  th 'Person'
  th 'URL'
  th 'Recind'
