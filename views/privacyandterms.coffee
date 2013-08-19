@title = 'privacy and terms'

@localScripts = ['/js/jquery.min','/js/bootstrap', '/js/parallax']

coffeescript ->
  $(document).ready =>


text '<div id="content-supporters" class="content container-fluid">'

div 'page-header', ->
  h1 ->
    text "Privacy Policy  "
    small "We will make every effort to keep your information confidential"
  
  ol ->
    li ->
      p  "We will never ask you for any more information than what we need to help you."
    li ->
      p  "We will make every attempt to keep your information secure, anonymous, and safe."
    li ->
      p "We may share aggregated information with organizations that will use this data responsibly, to make advances in the field of mental health."

div 'page-header', ->
  h1 ->
    text "Terms of Service  "
    small 'your health is your responsibility'

  p "Understand 'we' to mean ExoMachina, Inc, and all supporters under Domo.io. By you we mean all users of http://domo.io: supporters and advice seekers."
  
  ol ->
    li ->
      p  "The primary responsibility for your mental health rests with you. We connect you to services that, to the best of our knowledge, would help you. We may be wrong, and you accept that!"
      p ->
        text "You use Domo at will. You alone are responsible for decisions on using our services and any resulting consequences and agree to "
        b -> "absolve us of all liability around your decisions"
        text "."
    li ->
      p  "Any communication you receive from us in response to your request for advice should be considered confidential. You will not distribute/forward any such email to others. You agree not to re-share/sell content you find on domo.io."
    li ->
      p "Though it is not currently our primary business model, there is definite humane value to community wellness information. We may aggregate your ANNONYMIZED content with that of others for use by other companies, organizations, or individuals who partner with us."
      p "We claim high ethical standards, but such additional use will be made at our sole discretion."
    li ->
      p "You agree to not receive any compensation for any content you submit, post, or transmit using Domo."
    li ->
      p "We reserve the right, at all times, to remove or refuse to distribute any Content on the Services, to suspend or terminate users, and to reclaim any content without liability to you. We will typically do this when we feel there is abuse."

          
  br ->
  br ->
  p '', -> "we want you involved"
  a {class: "btn btn-primary btn-large btn-success",id:"Questions/concerns", href:"mailto:domo@domo.io?subject=Question%20regarding%20privacy%20or%20terms"}, -> 'email us if you have concerns/suggestions'


text '</ div>'
 
