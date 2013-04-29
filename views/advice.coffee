@title = 'get advice'
@stylesheets = ['/css/style','/css/bootstrap.min']
@localScripts = ['/js/jquery.min','/js/bootstrap']

defaultPlaceholderText = "How are you feeling now? How have you been feeling recently? What could you use help with?"

defaultText = "Right now I'm feeling: \n\nRecently I've been feeling: \n\nI could use some help with: \n"

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
    adviceContact = $('#adviceContactInput').val()
    if adviceContact?.length >0 && advice?.length > 0 && advice != adviceDefaultText
      $('#submitStatus').addClass('hidden')
      $("#submitButton").addClass('disabled')
      $.post "/s/advice", {advice: advice, adviceOn: adviceOn, adviceContact: adviceContact}, (response)=>
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
    text "Domo brings effective assistance"
    small -> " for anxiety, depression, and other struggles people encounter in life."

  legend -> "Through this anonymous request you'll receive advice from our network of therapists and other certified amazing people. If you'd like more of their advice, you can schedule a chat!"
  
  onText = null
  if @adviceOn? == true
     onText = "advice on: \n#{@adviceOn} \n\nthoughts:\n\n"
  textarea 'input-block-level', id:'adviceTextArea', type:'textarea', rows:6, placeholder: defaultPlaceholderText, -> onText
  span class: 'label label-success', -> 'and so we can get back to you!'
  br ->
  input type: "text", placeholder: "your email address or US phone number", id: "adviceContactInput", ->
  input 'btn btn-success right', id:"submitButton", type: 'submit', style: 'margin-top: 5px;', -> 'Submit'
  p 'text-warning hidden', id:'submitStatus', -> 'Thank you for your vignette!!'

h1 'text-success hidden', id:'thankYouText', ->
  text 'Thank you for your vignette!'
  small -> " We'll get you some advice ASAP! (days)"


text '</ div>'
