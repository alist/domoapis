@title = 'Welcome'
@stylesheets = ['/css/style','/css/bootstrap.min']
@localScripts = ['/js/bootstrap.min','/js/jquery.min']

coffeescript ->
  @window.submitCodePressed = (offerPersonName) ->
    codeVal = $('#codeInput').val()
    if codeVal == ""
      $('#badCodeWarning').text "enter a code!"
      $('#badCodeWarning').show()
      $('#codeEntryGroup').addClass('error')
    else
      $('#badCodeWarning').hide()
      $('#codeEntryGroup').removeClass('error')
      $("#submitButton").addClass('disabled')
       
      $.post "/apiv1/submitCode", {code: codeVal}, (response)=>
        if response?.status != "success"
          $('#badCodeWarning').text "invalid code"
          $('#badCodeWarning').show()
          $('#codeEntryGroup').addClass('error')
          $("#submitButton").removeClass('disabled')
          $("#codeCountRemaining").show()
        else
          $("#codeCountRemaining").hide()
          #$("#rewardBox").animate {opacity:1}, {duration: 'slow',easing: 'easein'}
          $("#rewardBox").show()
        console.log response
  

text '<div class="content container">'

h1 "Enter code for instant reward"

form 'form-horizontal', method:'GET', action:"#", onsubmit: 'window.submitCodePressed.apply(); return false;', ->
  legend -> 'Enter your code'
  div 'row-fluid', ->
    div 'span6', ->
      div 'control-group', id: 'codeEntryGroup', ->
        p 'text-error hidden' , id:'badCodeWarning', -> 'whoops, bad code, try again'
        label 'control-label', for: "codeInput", -> "Code:"
        div 'controls', ->
          input 'span1', maxlength:'4', style:'height: 30px; width: 45px;', type:'text', id:'codeInput', placeholder:'####', ->
      div 'control-group', ->
        div 'controls', ->
          input 'btn btn-success', id:"submitButton", type: 'submit', -> 'Submit'
          p 'text-info hidden', id:'codeCountRemaining', -> 'Two trys left'

    div 'span6', ->
      div 'alert alert-block alert-info hidden', id: 'rewardBox', ->
        h4 'alert-heading', -> "Code Submitted! "
        p -> "Now spin the prize-wheel!"
        a 'btn btn-primary', href: '#', -> "Spin!"

text '</ div>'
