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
      b "Two Door Cinema Club"
    div '#ratingConcertInfo', ->
      b "6/24/2012"
      text "House of Blues, Boston, MA"
    div '#ratingAndArtistTop', ->
      div '#artistImage', ->
      div '#ratingRatings', ->
        div '#ratingLine', ->
          b "overall rating:"
          img (id: "ratingImage", src: "/img/rating/5.png")
        div '#ratingLine', ->
          b "stage presence:"
          img (id: "ratingImage", src: "/img/rating/0.png")
        div '#ratingLine', ->
          b "sound quality:"
          img (id: "ratingImage", src: "/img/rating/2.png")
        div '#ratingLine', ->
          b "visuals/effects:"
          img (id: "ratingImage", src: "/img/rating/3.png")
    div '#ratingComment', ->
      p "Great Scott is a live music venue in Allston, MA. It is located at 1222 Commonwealth Avenue at the corner of Harvard Avenue. The venue is currently home to a wide range of live acts with a focus on live indie/rock and DJ based dance nights... Great Scott is a live music venue in Allston, MA. It is located at 1222 Commonwealth Avenue at the corner of Harvard Avenue. The venue is currently home to a wide range of live acts with a focus on live indie/rock and DJ based dance nights."
    div '#authorAndRatings', ->
      b "by Author With A very Very Long name"
      p '#ratingCount', -> '(167 ratings)'

div '#footerDisclaimer', ->
  a '#footerLink', href: '/', -> 'Home'
  p '#footerLink', -> ' | '
  a '#footerLink', href: '/faq', -> 'FAQ'
  p '#footerLink', -> ' | '
  a '#footerLink', href: '/contact', -> 'Contact Us'
  p '#allrightsFooter', -> '© 2012 TourBus LLC. All rights reserved.'
