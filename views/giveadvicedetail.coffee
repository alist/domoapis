@title = 'give advice'

adviceRequestID = @detailAdvice?._id.toString()

script type:'text/javascript', ->
  text "adviceRequestID = #{JSON.stringify(adviceRequestID)};"

coffeescript ->
  @window.submitPressed = () ->
    advice = $('#adviceTextArea').val()
    checkBoxChecked = $('#guidlinesAcceptedBox').is(":checked")

    errorAction = () ->
      $("#submitButton").removeClass('disabled')
      $('#submitStatus').removeClass('hidden')
      $('#submitStatus').text "Sorry there was an error. Copy your text and let domo@domo.io know if it keeps up!"
    
    if advice?.length >0 && checkBoxChecked == true
      $('#submitstatus').addClass('hidden')
      $("#submitButton").addClass('disabled')
      $.post("/giveadvice", {advice: advice, adviceRequestID: adviceRequestID}, (response)=>
        console.log response
        if response?.status != "success"
          errorAction()
        else
          drawResponseBox response.newResponse
          $('#adviceForm').addClass('hidden')
          $('#giveAdviceBox').addClass('hidden') ).error(errorAction)
    else
      $('#submitStatus').removeClass('hidden')
      if advice?.length > 0 && checkBoxChecked != true
        $('#submitStatus').text "please checkout those guidlines :)!"
      else
        $('#submitStatus').text "your advice, please!"
    return false

  drawResponseBox = (response) ->
    $('.adviceRow').last().after($("""<div class="row-fluid adviceRow adviceResponseRow"><li class="span12"><div class="caption"><h4 class="text-success">#{response.user.displayName}</h4><h5 class="grayLabel">#{response.modifiedDate.toString()}</h5><p class="adviceResponseText">#{response.adviceResponse}</p></div></li></div>""").hide().fadeIn())
  
text '<div class="content container-fluid">'

div 'page-header', ->
  a href: '/giveadvice', ->
    h1 "Give advice"
div 'row-fluid adviceRow', ->
  li 'span12', ->
    #supporter notifications
    if @detailAdvice?.status == "PRES" && @user?.permissions?.indexOf("admin") >= 0
      a href:"/notify/#{adviceRequestID}", -> "notify supporters"

    div 'caption', ->
      h4 'grayLabel', -> "#{@detailAdvice.modifiedDate.toString()}"
      p 'adviceRequestText', -> @detailAdvice.adviceRequest

drawResponseBox = (response, index) ->
  div 'row-fluid adviceRow adviceResponseRow', ->
    li 'span12', ->
      div 'caption', ->
        if response?.helpful >= 1
          h5 'helpfulLabel', -> 'Helpful! :-)'
        if response?.status != "APPR" && @user?.permissions?.indexOf("admin") >= 0
          a href:"/approve/#{adviceRequestID}/#{index}", -> "approve me"

        h4 'text-success', -> response.user.displayName
        h5 'grayLabel', -> "#{response.modifiedDate.toString()}"
        p 'adviceResponseText', -> response.adviceResponse

for response in @detailAdvice.responses
  drawResponseBox response, @detailAdvice.responses.indexOf(response)

div 'row-fluid', id: 'giveAdviceBox', ->
  ul 'thumbnails', ->
    li 'span12', ->
      h4 'text-success', -> @user.displayName
      form method:'GET', id:'adviceResponse', action:"#", onsubmit: 'window.submitPressed.apply(); return false;', ->
        textarea class: "input-block-level", id: 'adviceTextArea', rows: "3", placeholder: "your response!", ->
        div class:'controls-row', ->
          label class: 'checkbox span6', ->
            input id: 'guidlinesAcceptedBox', type: 'checkbox', ->
            text 'to the best of my ability, this adheres to the '
            a href:'/supporters', -> 'advice-giving guidlines'
          input 'btn btn-success right', id:"submitButton", type: 'submit', -> 'Submit'
        h4 'text-warning hidden', id:'submitStatus', -> 'Thank you for supporting!!'


text '</ div>'
