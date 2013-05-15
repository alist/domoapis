@title = 'get advice'

defaultPlaceholderText = "How have you been feeling recently? What could you use help with?"

defaultText = "Recently I've been feeling: \n\n\nI could use some help with: \n"


script type:'text/javascript', ->
  text "adviceDefaultText = #{JSON.stringify(defaultText)};"


coffeescript ->
  $(document).ready =>
    $('#adviceTextArea').focus (event) =>
      @window.focusToFeedback()
 
  @window.submitPressed = () ->
    advice = $('#adviceTextArea').val()
    adviceContact = $('#adviceContactInput').val()
    
    errorAction = () ->
      $("#submitButton").removeClass('disabled')
      $('#submitStatus').removeClass('hidden')
      $('#submitStatus').text "Sorry there was an error. Save your text and let domo@domo.io know if it keeps up!"
    
    if adviceContact?.length >0 && advice?.length > 0 && advice != adviceDefaultText
      $('#submitStatus').addClass('hidden')
      $("#submitButton").addClass('disabled')
      $.post("/getadvice", {adviceRequest: advice, adviceContact: adviceContact}, (response)=>
        console.log response
        if response?.status != "success"
          errorAction()
        else
          $('#thankYouText').removeClass('hidden')
          $('#adviceForm').addClass('hidden')).error(errorAction)

    else
      $('#submitStatus').removeClass('hidden')
      if advice?.length > 0 && advice != adviceDefaultText #then it's definitely the phone # we need
        $('#submitStatus').text "a way to get back to you, please!"
      else
        $('#submitStatus').text "your advice request, please!"
    return false

  @window.focusToFeedback = () ->
    advice = $('#adviceTextArea').val()
    if advice?.length == 0
      $('#adviceTextArea').text adviceDefaultText

text '<div class="content container-fluid">'

form method:'GET', id:'adviceForm', action:"#", onsubmit: 'window.submitPressed.apply(); return false;', ->
  h1 ->
     text 'Get advice through Domo' #hnk
     br ->
  legend -> "Through this anonymous request, vetted peers will engage you with empathy and support."
  
  onText = null
  if @adviceOn? == true
     onText = "advice on: \n#{@adviceOn} \n\nthoughts:\n\n"
  textarea 'input-block-level', id:'adviceTextArea', type:'textarea', rows:6, placeholder: defaultPlaceholderText, -> onText
  span class: 'label label-success', -> 'and so we can get back to you!'
  br ->
  input type: "text", placeholder: "US phone #", id: "adviceContactInput", ->
  input 'btn btn-success right', id:"submitButton", type: 'submit', style: 'margin-top: 5px;', -> 'Submit'
  p 'text-warning hidden', id:'submitStatus', -> 'Thank you for your vignette!!'

h1 'text-success hidden', id:'thankYouText', ->
  text 'Thank you for your vignette!'
  small -> " We'll get you some advice ASAP!"


text '</ div>'
