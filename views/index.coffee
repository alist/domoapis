@title = 'Hey!'
@hideToolbar = true

body style:"background-color: #fff; background-image: none;", ->
div 'contentHeaderBG', ->
  div 'contentHeader', ->
text '<div class="content-index container-fluid">'

section id:'index-about', ->
  h1 ->
     text 'Domo brings support with human compassion' #hnk
  p 'mission', -> 'Help with anxiety, depression, and IHTFP struggles from a group of awesome and peer-selected MIT students who care.'
  br ->

  if @redirectURL? #if for example, index is rendered from offer/:id
    script "window.redirectURL = '#{@redirectURL}'"

  p ->
      a {class: "btn btn-primary btn-large btn-success",id:"getAdviceButton", href:"/getadvice"}, -> 'Get advice'

      a {class: "btn btn-primary btn-large btn-success",id:"giveAdviceButton", href:"/supporters"}, -> 'Give advice'


  p 'lead', ->
    a 'findOutAboutSupporting', href: '/supporters', -> "now inviting supporters"
    text ' for our second pilot at MIT'

text '</ div>'
