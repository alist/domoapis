@title = 'TourBus App'
@stylesheets = ['/css/style']

div '#indexHeader', ->
  a href: "/", ->
    img (id:"indexLogo",src:"/img/tourbusIndexLogo.png")
  div '#ratingsAppStorePrompt', ->
    a href:"http://itunes.com/app/tourbus", ->
      img (src:"/img/tourbusIndexAppStoreButton.png")



div '#ratingContainer', ->
  div '#ratingDisplay', ->
    div '#ratingArtistName', ->
      b @artist.displayName

    div '#ratingConcertInfo', ->
      day = @concert?.startDateTime?.getDay() + 1
      month = @concert?.startDateTime?.getMonth() + 1
      year = @concert?.startDateTime?.getFullYear()
      dateStr = "#{day}/#{month}/#{year}"
      b dateStr
      venueStr = "#{@concert?.venue?.displayName}, #{@concert?.venue?.metroAreaDisplayName}"
      text venueStr
    div '#ratingAndArtistTop', ->
      img (id: 'artistImage', src: @artist.imageURI)
      div '#ratingRatings', ->
        div '#ratingLine', ->
          b "overall rating:"
          img (id: "ratingImage", src: "/img/rating/#{@rating.overallRating}.png")
        div '#ratingLine', ->
          b "stage presence:"
          img (id: "ratingImage", src: "/img/rating/#{@rating.stagePRating}.png")
        div '#ratingLine', ->
          b "sound quality:"
          img (id: "ratingImage", src: "/img/rating/#{@rating.soundQRating}.png")
        div '#ratingLine', ->
          b "visuals/effects:"
          img (id: "ratingImage", src: "/img/rating/#{@rating.visualsEffectsRating}.png")
    
    div '#ratingComment', ->
      p @rating.reviewText

    div '#authorAndRatings', ->
      b @author.authorDisplayName

      ratings = @author?.ratingCount
      ratingString = "(#{ratings} ratings)"
      if ratings == 1
        ratingString = "(#{ratings} rating)"
      p '#ratingCount', -> ratingString

div '#footerDisclaimer', ->
  a '#footerLink', href: '/', -> 'Home'
  p '#footerLink', -> ' | '
  a '#footerLink', href: '/faq', -> 'FAQ'
  p '#footerLink', -> ' | '
  a '#footerLink', href: '/contact', -> 'Contact Us'
  p '#allrightsFooter', -> '© 2012 TourBus LLC. All rights reserved.'
