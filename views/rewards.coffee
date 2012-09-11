@title = 'Welcome'
@stylesheets = ['/css/style','/css/bootstrap.min']
@localScripts = ['/js/jquery.old.min','/js/bootstrap']

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

text '<div class="content container-fluid">'

div 'page-header', ->
  h1 "Your health rewards"
ul 'thumbnails', ->
  for reward in @localAuthor?.rewards
    rewardOption = null
    for option in @localAuthor?.rewardOptions
      if reward.rewardOption.toString() == option._id.toString()
        rewardOption = option
        break
    li 'span4', ->
      div 'thumbnail alert-info reward', ->
        img src: rewardOption.imageURI
        div 'caption', ->
          h4 'rewardQuantity text-info', -> "$#{reward.totalQuantity.toString()}"
          h3 rewardOption.displayName
          a 'btn btn-primary', href: reward.redeemURL, -> 'Redeem'


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
