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
    checkBoxChecked = $('#skipContactBox').is(":checked")
    
    errorAction = () ->
      $("#submitButton").removeClass('disabled')
      $('#submitStatus').removeClass('hidden')
      $('#submitStatus').text "Sorry there was an error. Save your text and let domo@domo.io know if it keeps up!"
    
    if (adviceContact?.length >0 || checkBoxChecked == true) && advice?.length > 0 && advice != adviceDefaultText
      $('#submitStatus').addClass('hidden')
      $("#submitButton").addClass('disabled')
      $.post("/getadvice", {adviceRequest: advice, adviceContact: adviceContact}, (response)=>
        console.log response
        if response?.status != "success"
          errorAction()
        else
          adviceURL = "https://oh.domo.io/viewadvice/#{response.adviceInfo.accessToken}/#{response.adviceInfo.authToken}"
          $('#adviceURL').attr('href', adviceURL)
          $('#adviceURL').text(adviceURL)
          $('#thankYouText').fadeIn('fast')
          $('#domoGetAdviceHolder').hide()).error(errorAction)

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
      $('#infiniteLimit').removeClass('grayLabel')
      $('#infiniteLimit').addClass('darkGreenLabel')
      $('#infiniteLimit').text '∞'

text '<div class="content container-fluid">'

div id: 'domoGetAdviceHolder', ->
  h1 ->
     text 'Get advice through Domo'
     br ->
  p 'lead', -> 'MIT pilot one ended May 28, 2013'
  legend -> "We're using all we learned in pilot one to build support communities for trauma, abuse and other areas complementing our support around academic concerns. "
  p 'hearFromUs', ->
    text "You'll hear from us again towards the end of summer! "
  
  p 'lead hearFromUs', ->
    a 'findOutAboutSupporting', href: '/supporters', -> "We're now inviting supporters"
    text ' for our second pilot at MIT.'
  
###
div id: 'domoGetAdviceHolder', ->
  h1 ->
     text 'Get advice through Domo' #hnk
     br ->
  h4 'supporterCount', -> '12 MIT Supporters since May 16, 2013'
  legend -> "Through this anonymous request, vetted peers will engage you with empathy and support."
  div class:'row-fluid', ->
    div class: 'span3 pull-left ', id:"howItWorks", ->
      h4 '', -> "How it works:"
      ol ->
        li -> "You descibe what's up"
        li ->
          a href: '/supporters', -> "Supporter Domosapiens"
          text " respond at domo.io"
        li -> "You get SMS alerts about your responses"
        li -> "You're free to follow-up, but responses might be by different people"

    form method:'GET', class:'span9 pull-right', id:'adviceForm', action:"#", onsubmit: 'window.submitPressed.apply(); return false;', ->
      
      onText = null
      if @adviceOn? == true
         onText = "advice on: \n#{@adviceOn} \n\nthoughts:\n\n"
      
      div 'right row', ->
        h5 'grayLabel limitText inline', -> 'characters remaining: '
        h5 'limitText grayLabel inline', id: "infiniteLimit", -> '–'
      textarea 'input-block-level', id:'adviceTextArea', type:'textarea', rows:6, placeholder: defaultPlaceholderText, -> onText
      div class:'controls-row row-flexible', ->
        input class:'', type: "text", placeholder: "US phone #", id: "adviceContactInput", ->
        input 'btn btn-success right', id:"submitButton", type: 'submit', style: 'margin-top: 5px;', -> 'Submit'
        label class: 'checkbox', ->
          input id: 'skipContactBox', type: 'checkbox', ->
          text 'no thanks, just give me a URL to check later'
      h4 'text-warning hidden', id:'submitStatus', -> 'Thanks for using Domo!!'

div class:'hidden', id:'thankYouText', ->
  h1 'text-success', ->
    text 'Thanks for trusting Domo!'
    small -> " We'll get back to you within a few hours "
  h3 ->
    text "If you need help NOW, you should call "
    b "911"
    text " or visit "
    a href:"http://medweb.mit.edu/directory/services/emergency_care.html", -> "MIT Mental Health"
    text '.'
  br ->
  h4 ->
    text "Here's a URL to copy if you ever want to visit your advice page before/without getting an SMS from us. If you didn't leave a phone #, you'll need this:"
    br ->
    br ->
    a id:'adviceURL', href: '/s', target: '_blank', -> '//ttstsatstatsatsats'
###

text '</ div>'
