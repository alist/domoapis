

module.exports = function(app) {
    app.get('/partials/:name', servePartials);
}

function servePartials(req, res) {
  var name = req.params.name;
  res.render('partials/' + name);
}