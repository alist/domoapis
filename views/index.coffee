@title = 'Hey!'
@hideToolbar = true

emailAddress = @emailAddress?.toString()
script type:'text/javascript', ->
  text "emailAddress = #{JSON.stringify(emailAddress)};"


coffeescript ->
  @window.submitPressed = () ->
    $('#submitButton').addClass('disabled')
    
    errorAction = () ->
      $("#submitButton").removeClass('disabled')
      $('#submitStatus').removeClass('hidden')
      $('#submitStatus').text 'server-error!'

    emailAddress = $('#emailAddressInput').val()

    $.post("/inviterequest", {emailAddress: emailAddress}, (response)=>
      if response?.status != "success" || response?.emailAddress? == false
        errorAction()
      else
        $('#submitSuccess').removeClass('hidden')
        $('#submitStatus').addClass('hidden')
    ).error(errorAction)

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
      
text '</ div>'

<<<<<<< HEAD
form 'form-horizontal',id:'emailRequestForm', method:'POST', action:"#", onsubmit: 'window.submitPressed.apply(); return false;', ->
  h4 'text-warning hidden', id:'submitStatus', -> "Whoops, an error occured. :( email domo@domo.io if it keeps up!"
  h4 'text-success hidden', id:'submitSuccess', -> "Thank you for submitting your request. We'll be in touch shortly."
  p 'lead', ->
    label 'span5', style: 'margin-left: 0px', for: "emailAddressInput", -> "Now in pre-release for initial partnerships: request an invite    "
    input 'span3', style:'height: 20px; width: 310px;', type:'text', id:'emailAddressInput', placeholder:'your email address',value: @emailAddress, ->
    input 'btn btn-inverse btn-mini btn-success', id:"submitButton", style: "margin-left: 5px", type: 'submit', -> 'submit request'
=======
  p 'lead', ->
    a 'findOutAboutSupporting', href: '/supporters', -> "now inviting supporters"
    text ' for our second pilot at MIT'
###
text '</ div>'