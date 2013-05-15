@title = 'supporters'

@localScripts = ['/js/jquery.min','/js/bootstrap', '/js/parallax']

text '<div id="content-supporters" class="content container-fluid">'

div 'page-header', ->
  h1 ->
    text "Be a Domosapien  "
    small 'support your peers on Domo'

  p 'Your role is to support, providing one message choc-full of empathy that others can appreciate that links them to resources based on your prior experience. There is no notion of a follow-up messages within Domo. Do your best to answer each response fully.'
  h2 id:'principlesHeader', -> 'Three core principles of Domodom'
section id:'s1', ->
  h2 'cornerNumber', -> 'One:'
  h2 'p1', -> 'The Domosapien promises to keep exchanges confidential.'
section id:'i1', 'data-type':"background", 'data-speed':"10", 'data-offsety':"0", ->
section id:'s2',->
  h2 'cornerNumber', -> 'Two:'
  h2 'p2', -> 'Though most of us are not mental health professionals, we’re all Domosapiens. '
  h4 -> 'We’re on an equal level with everyone seeking support.'
  h4 -> "As Domosapiens, we're simply on a mission to help our fellow human."

section id:'i2', 'data-type':"background", 'data-speed':"8", 'data-offsety':"100", ->
  section id:'i2-s', 'data-type':"background", 'data-speed':"-8", 'data-offsety':"-150", ->

section id:'s3',->
  h2 'cornerNumber', -> 'Three:'
  h2 'p3', -> 'Domo-sapiens are connectors, both to support services and to support groups.'
  h4 -> 'here are some resources you should be familiar with'
  h5 ->
    ul ->
      li ->
        a href: "http://web.mit.edu/student/digest/asking.html?utm_source=2013-05#personal", -> "MIT Q/A page w. tons of resources"
      li ->
        a href: "http://www.suicidepreventionlifeline.org/GetHelp/Online", -> "National Suicide Prevention Hotline"
   
section id:'s4',->
  h2 'cornerNumber', -> 'Sound good?'
  br ->
  br ->
  a {class: "btn btn-primary btn-large btn-success",id:"getInvolvedButton", href:"mailto:domo@domo.io?subject=Applying%20to%20Give%20Advice"}, -> 'email us to get involved with Domo'

  p 'currentyBeta', -> "we're currently in beta for the MIT community"

text '</ div>'
