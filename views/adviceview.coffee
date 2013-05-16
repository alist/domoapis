@title = 'advice'

noCodeText = "Please enter your auth code! Email domo@domo.io w/ your phone # to get a new one!"
errorText = "Sorry there was an error. Let domo@domo.io know if it keeps up!"
badCodeText = "Oops, bad auth code! Try again or email domo@domo.io w/ your phone # to get a new one!"

script type:'text/javascript', ->
  text "advice = #{JSON.stringify(@advice)};"
  text "accessToken = #{JSON.stringify(@accessToken)};"
  text "noCodeText = #{JSON.stringify(noCodeText)};"
  text "badCodeText = #{JSON.stringify(badCodeText)};"
  text "errorText = #{JSON.stringify(errorText)};"



coffeescript ->
  $(document).ready =>
    if advice?
      $('#authCodeForm').addClass('hidden')
      updateForAdviceRequest response.advice

  @window.submitPressed = () ->
    code = $('#codeInput').val()

    errorAction = () ->
      $("#submitButton").removeClass('disabled')
      $('#submitStatus').removeClass('hidden')
      $('#submitStatus').text errorText
    
    if code?.length >0
      $('#submitstatus').addClass('hidden')
      $("#submitButton").addClass('disabled')
      $.post("/viewadvice/#{accessToken}", {authToken: code}, (response)=>
        console.log response
        if response?.status != "success" || response?.advice? == false
          errorAction()
          $('#submitStatus').text badCodeText
        else
          $('#authCodeForm').addClass('hidden')
          updateForAdviceRequest response.advice
          ).error(errorAction)
    else
      $('#submitStatus').removeClass('hidden')
      $('#submitStatus').text noCodeText
    return false


  drawAdviceRequestBox = (adviceRequest) ->
    $('.page-header').after("""<div class="row-fluid adviceRow"><li class="span12"><div class="caption"><h4 class="text-info">#{adviceRequest.modifiedDate.toString()}</h4><p class="adviceRequestText">#{adviceRequest.adviceRequest} </p></div></li></div>""")

  drawResponseBox = (response) ->
    $('.adviceRow').last().after("""<div class="row-fluid adviceRow adviceResponseRow"><li class="span12"><div class="caption"><h4 class="text-success">#{response.user.displayName}</h4><h5 class="text-info">#{response.modifiedDate.toString()}</h5><p class="adviceResponseText">#{response.adviceResponse}</p></div></li></div>""")

  updateForAdviceRequest = (adviceRequest) ->
    drawAdviceRequestBox adviceRequest
    for response in adviceRequest.responses
      drawResponseBox response
    $('.adviceRow').hide().slideDown(400)


text '<div class="content container-fluid">'


div 'page-header', ->
  h1 "hey, you've got advice!"





form 'form-horizontal',id:'authCodeForm', method:'GET', action:"#", onsubmit: 'window.submitPressed.apply(); return false;', ->
  legend -> 'Enter your auth code'
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
  p 'text-warning hidden', id:'submitStatus', -> noCodeText

text '</ div>'
