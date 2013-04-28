@title = 'get advice'
@stylesheets = ['/css/style','/css/bootstrap.min']
@localScripts = ['/js/jquery.min','/js/bootstrap']

defaultPlaceholderText = "How are you feeling now? How have you been feeling recently? What could you use some help in?"

defaultText = "Right now I'm feeling: \n\nRecently I've been feeling: \n\nI could use some help in: \n"

script type:'text/javascript', ->
  text "adviceDefaultText = #{JSON.stringify(defaultText)};"
  if @adviceOn? == true
    text "adviceOn =  #{JSON.stringify(@adviceOn)};"
  else
    text "adviceOn = 'general';"

coffeescript ->
  $(document).ready =>
    $('#adviceTextArea').focus (event) =>
      @window.focusToFeedback()
 
  @window.submitPressed = () ->
    advice = $('#adviceTextArea').val()
    if advice?.length > 0 && advice != adviceDefaultText
      $('#submitStatus').addClass('hidden')
      $("#submitButton").addClass('disabled')
      $.post "/s/advice", {advice: advice, adviceOn: adviceOn}, (response)=>
        console.log response
        if response?.status != "success"
          $("#submitButton").removeClass('disabled')
          $('#submitStatus').removeClass('hidden')
          $('#submitStatus').text "Sorry there was an error. :( Let domo@domo.io know if it keeps up!"
        else
          $('#thankYouText').removeClass('hidden')
          $('#adviceForm').addClass('hidden')
 
    else
      $('#submitStatus').removeClass('hidden')
      $('#submitStatus').text "advice, please!"
    return false

  @window.focusToFeedback = () ->
    advice = $('#adviceTextArea').val()
    if advice?.length == 0
      $('#adviceTextArea').text adviceDefaultText

text '<div class="content container-fluid">'

h1 ->
  text "Domo brings people "
  small -> "effective assistance for anxiety, depression, and other struggles they encounter in life."

form method:'GET', id:'adviceForm', action:"#", onsubmit: 'window.submitPressed.apply(); return false;', ->
  legend -> "Through your anonymous vignette you'll receive advice from our network of therapists and other validated amazing people. You can schedule to meet with any of them!"
  
  onText = null
  if @adviceOn? == true
     onText = "advice on: \n#{@adviceOn} \n\nthoughts:\n\n"
  textarea 'input-block-level', id:'adviceTextArea', type:'textarea', rows:6, placeholder: defaultPlaceholderText, -> onText
  input 'btn btn-success', id:"submitButton", type: 'submit', -> 'Submit'
  p 'text-warning hidden', id:'submitStatus', -> 'Thank you for the advice!!'

h1 'text-success hidden', id:'thankYouText', -> 'Thank you for your advice!'


text '</ div>'
