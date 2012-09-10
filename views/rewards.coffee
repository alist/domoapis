@title = 'Welcome'
@stylesheets = ['/css/style','/css/bootstrap.min']
@localScripts = ['/js/bootstrap.min','/js/jquery.min']

coffeescript ->
  $(document).ready =>
    $('.rewardOption').click (event) =>
      $('#updateRewardOptionsButton').removeClass('invisible').fadeIn()
      selectedClass = 'alert-info'
      if $(event.currentTarget).hasClass selectedClass
        $(event.currentTarget).removeClass selectedClass
      else
        $(event.currentTarget).addClass selectedClass
  @window.updateRewardOptionsPressed = ->
    console.log "update pressed"
 
body ->

text '<div class="content container">'

div 'page-header', ->
  h1 "Here's where you see your rewards"

div 'page-header', ->
  h1 'inline', -> "Reward Options"
  a 'btn btn-primary headerButtonRight invisible', id: 'updateRewardOptionsButton', href:'#', href2:"javascript:void(0)", onclick: 'window.updateRewardOptionsPressed.apply()', -> 'Update'

#doesn't dynamically put selected reward options into an array yet for submission
ul 'thumbnails', ->
  for rewardOption in @rewardOptions
    li 'span4', ->
      div 'thumbnail alert-info rewardOption', ->
        img src: rewardOption.imageURI
        div 'caption', ->
          h3 rewardOption.displayName
          p rewardOption.description

text '</ div>'
