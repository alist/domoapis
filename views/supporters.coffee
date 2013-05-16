@title = 'supporters'

@localScripts = ['/js/jquery.min','/js/bootstrap', '/js/parallax']

coffeescript ->
  $(document).ready =>


text '<div id="content-supporters" class="content container-fluid">'

div 'page-header', ->
  h1 ->
    text "Be a Domosapien  "
    small 'support your peers through Domo'
  p "The role of Domosapien is to support anonymous peers that ask for help, responding with empathy and resources based on their prior experience. Each response of a Domosapien is voluntary."
  h2 id:'principlesHeader', -> 'Three core principles of Domodom'
section id:'s1', ->
  h2 'cornerNumber', -> '1:'
  h2 'p1', -> 'The Domosapien keeps exchanges confidential.'
section id:'i1', 'data-type':"background", 'data-speed':"10", 'data-offsety':"0", ->
section id:'s2',->
  h2 'cornerNumber', -> '2:'
  h2 'p2', ->
    text "We’re all Domosapiens."
    br ->
    text "We don't work alone."
  h4 -> "We're not mental health professionals, but we offer our perspectives and support because we care."
  h4 -> "We bring more than one voice when advising a person in need."

section id:'i2', 'data-type':"background", 'data-speed':"10", 'data-offsety':"40", ->
  section id:'i2-s', 'data-type':"background-disabled", 'data-speed':"-8", 'data-offsety':"-150", ->

section id:'s3',->
  h2 'cornerNumber', -> '3:'
  h2 'p3', -> 'Domo-sapiens are connectors.'
  h4 -> 'We connect people to the services and groups we feel are relevant.'
  h4 -> 'Here are some resources to be familiar with:'
  h5 ->
    ul ->
      li ->
        a target:'_blank', href: "http://web.mit.edu/student/digest/asking.html?utm_source=2013-05#personal", -> "MIT Q/A page w. tons of resources"
      li ->
        a target:'_blank', href: "http://www.suicidepreventionlifeline.org/GetHelp/Online", -> "National Suicide Prevention Hotline"
   
section id:'s4',->
  h2 'cornerNumber', -> 'Sound good?'
  br ->
  br ->
  a {class: "btn btn-primary btn-large btn-success",id:"getInvolvedButton", href:"mailto:domo@domo.io?subject=Applying%20to%20Give%20Advice"}, -> 'email us to get involved with Domo'

  p 'currentyBeta', -> "we're currently in beta for the MIT community"

text '</ div>'
