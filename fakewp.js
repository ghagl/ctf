const Router = require('express').Router();

Router.get('/', (req, res) => {
	if (req.session.level !== 7) res.redirect('/');
	res.statusCode = 401
	res.set('WWW-Authenticate', 'Basic realm="BigCookieBusiness"');
  res.end('Access denied')
});

module.exports = Router;
