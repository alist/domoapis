@title = 'give advice'

script type:'text/javascript', ->
  text "adviceRequestID = #{JSON.stringify(@detailAdvice._id.toString())};"

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
          $('#adviceForm').addClass('hidden')
          $('#giveAdviceBox').addClass('hidden') ).error(errorAction)
    else
      $('#submitStatus').removeClass('hidden')
      if advice?.length > 0 && checkBoxChecked != true
        $('#submitStatus').text "please checkout those guidlines :)!"
      else
        $('#submitStatus').text "your advice, please!"
    return false

  
text '<div class="content container-fluid">'

div 'page-header', ->
  a href: '/giveadvice', ->
    h1 "Give advice"
div 'row-fluid adviceRow', ->
  li 'span12', ->
    div 'caption', ->
      h4 'text-info', -> "#{@detailAdvice.modifiedDate.toString()}"
      p 'adviceRequestText', -> @detailAdvice.adviceRequest

drawResponseBox = (response) ->
  div 'row-fluid adviceRow adviceResponseRow', ->
    li 'span12', ->
      div 'caption', ->
        h4 'text-success', -> response.user.displayName
        h5 'text-info', -> "#{response.modifiedDate.toString()}"
        p 'adviceResponseText', -> response.adviceResponse

for response in @detailAdvice.responses
  drawResponseBox(response)

div 'row-fluid', id: 'giveAdviceBox', ->
  ul 'thumbnails', ->
    li 'span12', ->
      h4 'text-success', -> @user.displayName
      form method:'GET', id:'adviceResponse', action:"#", onsubmit: 'window.submitPressed.apply(); return false;', ->
        textarea class: "input-block-level", id: 'adviceTextArea', rows: "3", placeholder: "your response!", ->
        div class:'controls-row', ->
          label class: 'checkbox span6', ->
            input id: 'guidlinesAcceptedBox', type: 'checkbox', ->
            text 'to the best of my ability, this adheres to the advice-giving guidlines'
          input 'btn btn-success right', id:"submitButton", type: 'submit', -> 'Submit'
        p 'text-warning hidden', id:'submitStatus', -> 'Thank you for supporting!!'


text '</ div>'
