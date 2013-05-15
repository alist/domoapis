@title = 'Hey!'
@hideToolbar = true

body style:"background-color: #fff; background-image: none;", ->
div 'contentHeaderBG', ->
  div 'contentHeader', ->
text '<div class="content container-fluid">'

section id:'index-about', ->
  h1 ->
     text 'Domo brings support with human compassion' #hnk
  p 'mission', -> 'Help with anxiety, depression, and other life struggles from an group of awesome and validated peers who care.'
  br ->

  if @redirectURL? #if for example, index is rendered from offer/:id
    script "window.redirectURL = '#{@redirectURL}'"

  p ->
      a {class: "btn btn-primary btn-large btn-success",id:"getAdviceButton", href:"/getadvice"}, -> 'Get advice'

      a {class: "btn btn-primary btn-large btn-success",id:"giveAdviceButton", href:"mailto:domo@domo.io?subject=Applying%20to%20Give%20Advice"}, -> 'Give advice'


  p 'lead', -> 'Currently in beta for the MIT community'

text '</ div>'
