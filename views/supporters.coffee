@title = 'supporters'


text '<div id="content-supporters" class="content container-fluid">'

div 'page-header', ->
  h1 ->
    text "Be a Domosapien  "
    small 'support your peers on Domo'

  p 'Your role is to support, providing one message choc-full of empathy that others can appreciate that links them to resources based on your prior experience. There is no notion of a follow-up messages within Domo. Do your best to answer each response fully.'
  h2 id:'principlesHeader', -> 'Three core principles of Domodom'
section id:'s1', ->
  h2 'cornerNumber', -> 'One:'
  h2 'The Domosapien promises to keep exchanges confidential.'
section id:'i1', ->
section id:'s2',->
  h2 'cornerNumber', -> 'Two:'
  h2 'Though most of us are not mental health professionals, we’re all Domosapiens. '
section id:'i2', ->
section id:'s3',->
  h2 'cornerNumber', -> 'Three:'
  h2 'Domo-sapiens are connectors, both to support services and to support groups.'
  h4 -> 'here are some resources you should be familiar with'
  h5 ->
    a href: "http://web.mit.edu/student/digest/asking.html?utm_source=2013-05#personal", -> "MIT Q/A page w. tons of resources"
    br ->
    a href: "http://www.suicidepreventionlifeline.org/GetHelp/Online", -> "National Suicide Prevention Hotline"
   
text '</ div>'
