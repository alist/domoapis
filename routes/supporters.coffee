exports.principles_list = (req, res) ->
  #@enable 'layout'
  #@view 'layout.jade'
  #@render supporters: {}
  #@render 'supporters.coffee', layout: 'layout.coffee'
  #@render supporters: {layout: 'layout.coffee'}
  #@render 'index.jade', layout: 'layout.jade'
  
   @render 'supporters.jade', layout: 'layout.jade'
