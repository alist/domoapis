@title = 'feedback'
@stylesheets = ['/css/style','/css/bootstrap.min']
@localScripts = ['/js/jquery.min','/js/bootstrap']

defaultPlaceholderText = "How are you feeling now? How have you been feeling recently? What could you use some help in?"

defaultText = "Right now I'm feeling: \n\nRecently I've been feeling: \n\nI could use some help in: \n"

script type:'text/javascript', ->
  text "feedbackDefaultText = #{JSON.stringify(defaultText)};"
  if @feedbackOn? == true
    text "feedbackOn =  #{JSON.stringify(@feedbackOn)};"
  else
    text "feedbackOn = 'general';"

coffeescript ->
  $(document).ready =>
    $('#feedbackTextArea').focus (event) =>
      @window.focusToFeedback()
 
  @window.submitPressed = () ->
    feedback = $('#feedbackTextArea').val()
    if feedback?.length > 0 && feedback != feedbackDefaultText
      $('#submitStatus').addClass('hidden')
      $("#submitButton").addClass('disabled')
      $.post "/s/feedback", {feedback: feedback, feedbackOn: feedbackOn}, (response)=>
        console.log response
        if response?.status != "success"
          $("#submitButton").removeClass('disabled')
          $('#submitStatus').removeClass('hidden')
          $('#submitStatus').text "Sorry there was an error. :( . better feedback, please!"
        else
          $('#thankYouText').removeClass('hidden')
          $('#feedbackForm').addClass('hidden')
 
    else
      $('#submitStatus').removeClass('hidden')
      $('#submitStatus').text "feedback, please!"
    return false

  @window.focusToFeedback = () ->
    feedback = $('#feedbackTextArea').val()
    if feedback?.length == 0
      $('#feedbackTextArea').text feedbackDefaultText

text '<div class="content container-fluid">'

h1 ->
  text "Domo brings people "
  small -> "effective assistance for anxiety, depression, and other struggles they encounter in life."

form method:'GET', id:'feedbackForm', action:"#", onsubmit: 'window.submitPressed.apply(); return false;', ->
  legend -> "Through your anonymous vignette you'll receive advice from our network of therapists and other validated amazing people. You can schedule to meet with any of them!"
  
  onText = null
  if @feedbackOn? == true
     onText = "feedback on: \n#{@feedbackOn} \n\nthoughts:\n\n"
  textarea 'input-block-level', id:'feedbackTextArea', type:'textarea', rows:6, placeholder: defaultPlaceholderText, -> onText
  input 'btn btn-success', id:"submitButton", type: 'submit', -> 'Submit'
  p 'text-warning hidden', id:'submitStatus', -> 'Thank you for the feedback!!'

h1 'text-success hidden', id:'thankYouText', -> 'Thank you for your feedback!'


text '</ div>'
