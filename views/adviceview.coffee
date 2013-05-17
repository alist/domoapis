@title = 'advice'

noCodeText = "Please enter your auth code! Email domo@domo.io w/ your phone # to get a new one!"
errorText = "Sorry there was an error. Let domo@domo.io know if it keeps up!"
badCodeText = "Oops, bad auth code! Try again or email domo@domo.io w/ your phone # to get a new one!"

script type:'text/javascript', ->
  text "advice = #{JSON.stringify(@advice)};"
  text "authToken = #{JSON.stringify(@advice?.authToken)};"
  text "accessToken = #{JSON.stringify(@accessToken)};"
  text "noCodeText = #{JSON.stringify(noCodeText)};"
  text "badCodeText = #{JSON.stringify(badCodeText)};"
  text "errorText = #{JSON.stringify(errorText)};"
  text "helpfulLabel = \"<h5 class='helpfulLabel'>Helpful! :-)</h5>\";"
  text "wasitHelpfulLabel = \"<h5 class='helpfulLabel'><a class='wasitHelpfulLink'>Helpful?</a></h5>\";"



coffeescript ->
  @window.helpfulPressed = (element) ->
    helpfulIndex = advice.responses?.length-1-( $('h5.helpfulLabel').last().parent().parent().parent().index() - element.parent().parent().parent().index())
    element.hide()
    helpfulErrorAction = () =>
      element.fadeIn()
    $.post("/setadvicehelpful/#{accessToken}", {authToken: authToken, adviceIndex:helpfulIndex}, (response)=>
      console.log response
      if response?.status != "success"
         helpfulErrorAction()
      else
        element.after($(helpfulLabel).hide().fadeIn())
    ).error helpfulErrorAction
  
  $(document).ready =>
    if advice?
      $('#authCodeForm').addClass('hidden')
      updateForAdviceRequest advice, false

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
          advice = response.advice
          authToken = advice?.authToken
          updateForAdviceRequest response.advice, true
          ).error(errorAction)
    else
      $('#submitStatus').removeClass('hidden')
      $('#submitStatus').text noCodeText
    return false


  drawAdviceRequestBox = (adviceRequest) ->
    $('.page-header').after("""<div class="row-fluid adviceRow"><li class="span12"><div class="caption"><h4 class="grayLabel">#{adviceRequest.modifiedDate.toString()}</h4><p class="adviceRequestText">#{adviceRequest.adviceRequest} </p></div></li></div>""")

  drawResponseBox = (response) ->
    $('.adviceRow').last().after("""<div class="row-fluid adviceRow adviceResponseRow"><li class="span12"><div class="caption"><h4 class="text-success">#{response.user.displayName}</h4><h5 class="grayLabel">#{response.modifiedDate.toString()}</h5><p class="adviceResponseText">#{response.adviceResponse}</p></div></li></div>""")
    if response.helpful >= 1
      $('.caption').last().prepend(helpfulLabel)
    else
      $('.caption').last().prepend(wasitHelpfulLabel)

  updateForAdviceRequest = (adviceRequest, animate) ->
    drawAdviceRequestBox adviceRequest
    for response in adviceRequest.responses
      drawResponseBox response
    #was it helpful link
    $('.wasitHelpfulLink').parent().click  (e) =>
      @window.helpfulPressed($(e.currentTarget))
    
    if animate == true
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
  h4 'text-warning hidden', id:'submitStatus', -> noCodeText

text '</ div>'
