@title = 'Welcome'
@stylesheets = ['/css/style','/css/bootstrap.min']
@localScripts = ['/js/jquery.old.min','/js/bootstrap', '/js/galleryWheel', '/js/jquery.transform.min']

coffeescript ->
  @window.rewardSpinPressed = () ->
    $('#spinButton').fadeOut()
    window.galleryWheelSpin window.winningOption?.rewardOption?.imageURI, =>
      winningIssuance = window.winningOption.reward.issuances[window.winningOption.reward.issuances.length-1]
      $('#rewardWinningsText').text ("You've won $#{winningIssuance?.quantity} of #{window.winningOption.rewardOption.displayName}!")
      $('#rewardWinnings').fadeIn()

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
        console.log response
        if response?.status != "success"
          $('#badCodeWarning').text "invalid code"
          $('#badCodeWarning').show()
          $('#codeEntryGroup').addClass('error')
          $("#submitButton").removeClass('disabled')
          $("#codeCountRemaining").show()
        else
          $("#codeCountRemaining").hide()
          $("#codeEntrySpan").fadeOut 'slow', =>
            $("#rewardBox").fadeIn()
          window.winningOption = null
          for option in response?.rewardOptions
            insertRow = "<img class='galleryImg' src='#{option.imageURI}' alt='' />"
            $('#gallery-wheel').append insertRow
            if response?.reward?.rewardOption == option._id
              window.winningOption = {rewardOption: option, reward: response?.reward}
          #let's find the option that's the winner
          window.galleryWheelInit()
      
text '<div class="content container-fluid">'

h1 "Enter code to stay on track with your health"

form 'form-horizontal', method:'GET', action:"#", onsubmit: 'window.submitCodePressed.apply(); return false;', ->
  legend -> 'Enter your health code'
  div 'row-fluid', ->
    div 'span4', id: 'codeEntrySpan', ->
      div 'control-group', id: 'codeEntryGroup', ->
        p 'text-error hidden' , id:'badCodeWarning', -> 'whoops, bad code, try again'
        label 'control-label', for: "codeInput", -> "Code:"
        div 'controls', ->
          input 'span1', maxlength:'4', style:'height: 30px; width: 45px;', type:'text', id:'codeInput', placeholder:'####', ->
      div 'control-group', ->
        div 'controls', ->
          input 'btn btn-success', id:"submitButton", type: 'submit', -> 'Submit'
          p 'text-info hidden', id:'codeCountRemaining', -> 'Two trys left'

    div 'span10', ->
      div 'hidden alert alert-block alert-info', id: 'rewardBox', ->
        h4 'alert-heading', -> "Great job! "
        p -> "Now spin your prize-wheel!"
        
        div id: 'gallery', ->
          div id: 'gallery-wheel', ->
          div id: "gallery-center", ->

        a 'btn btn-primary', id:'spinButton', href:"javascript:void(0)", onclick: 'window.rewardSpinPressed.apply()', -> "Spin!"
        div 'hidden', id: 'rewardWinnings', ->
          p 'text-success', id:'rewardWinningsText', -> 'WHoah!'
          a 'btn btn-success btn-medium', href: '/rewards', -> 'View Reward!'

text '</ div>'
