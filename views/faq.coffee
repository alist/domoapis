@title = 'TourBus App | FAQ'
@stylesheets = ['/css/style']

div '#stdHeader', ->
  div '#stdHeaderContent', ->
    a href: "/", ->
      img (id:"stdLogo",src:"/img/tourbusStdHeaderLogo.png")
    div '#headerLinks', ->
      a '#headerLink', href: '/', -> 'Home'
      p '#headerLink',  class:'headerSeperator', -> '|'
      a '#headerLink', class:'currentHeaderLink', href: '/faq', -> 'FAQ'
      p '#headerLink',  class:'headerSeperator', -> '|'
      a '#headerLink', href: '/contact', -> 'Contact Us'

div '#contentBox', ->
  div '#content', ->
    div '#faqInfoTextHeader', ->
    div '#infoText', ->
      b "What is TourBus?"
      p ->
        text "TourBus is an app that helps you discover the best live bands by providing ratings and reviews by other music fans of their past performances."
      b "How does it work?"
      ol ->
       li "First, you'll check into a concert on your iPhone."
       li "From there, you'll be able to share your opinion on the artists by rating them right in the moment."
       li "Then there’s SoundBoard, an ongoing discussion forum for each concert where you can interact with other people at the show and read their reviews as they happen."
       li "TourBus will use the ratings to tell you about the best live artists coming to a venue near you."

      b "How much does the app cost?"
      p ->
        text "TourBus is 100% free and is available on the App Store."

      b "How did TourBus get started?"
      p ->
        text "TourBus is an idea that has been in the works for awhile. After going to hundreds of concerts over the years, Sam Mullins decided there was a better way to share and experience live music. Feeling inspired late one night after a show, he went home and drew out the basics of the app and the rest is history."
 
      b "Where do you get all your concert information?"
      p ->
        text "All of the basic concert information (artist, venue, date) comes from the outstanding folks at Songkick. <br />"
        text "The rest of the ratings and reviews come from our loyal fan base."
   
      b "When will TourBus be available on other devices?"
      p ->
        text "We will explore adapting TourBus for other devices as soon as we feel that the iPhone experience is as solid as possible."

      b "Are you hiring?"
      p ->
        text "We are currently not hiring, but check back for job postings as they become available."

 
    div '#stdAllrightsFooter', ->
      b '©'
      text ' 2012 TourBus LLC. All rights reserved.'
