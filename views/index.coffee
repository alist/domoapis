@title = 'Hey!'
@hideToolbar = true

body style:"background-color: #fff; background-image: none;", ->
div 'contentHeaderBG', ->
  div 'contentHeader', ->
text '<div class="content-index container-fluid">'

section id:'index-about', ->
  h1 ->
     text 'Peer support made superb.' #hnkincreases engagement through 
  #p 'mission', -> 'Domo is giving people an anonymous way to get Q/A style support for career or personal issues through peers in their business or academic communities.'
  p 'mission', -> "By engaging existing community members as mentors, Domo minimizes the time taken for new employees and students to become productive."
  p 'mission', -> "Through tools to analyze and document the anonymous support mentors give, Domo enables growing organizations to visualize and maintain the culture they'd like their communities to have."
  p 'lead', -> "Domo recently finished a pilot for undergraduates at MIT."
  br ->

  if @redirectURL? #if for example, index is rendered from offer/:id
    script "window.redirectURL = '#{@redirectURL}'"


  p ->
      a {class: "btn btn-primary btn-large btn-success",id:"getAdviceButton", href:"mailto:domo@domo.io"}, -> 'Get in touch'
      a {class: "btn btn-primary btn-large btn-info",id:"giveAdviceButton", href:"/supporters"}, -> 'Learn about giving advice on Domo'
###
  p ->
      a {class: "btn btn-primary btn-large btn-success",id:"getAdviceButton", href:"/getadvice"}, -> 'Get advice'

      a {class: "btn btn-primary btn-large btn-success",id:"giveAdviceButton", href:"/supporters"}, -> 'Give advice'

  p 'lead', ->
    a 'findOutAboutSupporting', href: '/supporters', -> "now inviting supporters"
    text ' for our second pilot at MIT'
###
text '</ div>'
