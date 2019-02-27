'use strict';

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');

var MySQLStore = require('express-mysql-session')(session);
var options = {
    host: 'CENSORED',
    port: 3306,
    user: 'CENSORED',
    password: 'CENSORED',
    database: 'session',
    expiration: 2592000000,
    clearExpired: true,
    checkExpirationInterval: 900000,
};
var sessionStore = new MySQLStore(options);

const app = express();
const helmet = require('helmet');
app.use(helmet());
app.use(helmet.hidePoweredBy({ setTo: 'PHP/5.3.3' }));

const {TwingEnvironment, TwingLoaderFilesystem} = require('twing');
const loader = new TwingLoaderFilesystem('./templates');
const twing = new TwingEnvironment(loader);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('./assets', {dotfiles:'allow'}), express.static('./images'));
app.use(session({
	secret: 'CENSORED',
	resave: false,
	saveUninitialized: true,
	store: sessionStore,
	expires: new Date(Date.now() + (30 * 86400 * 1000)),
	cookie: { secure: false }
}));

app.use(function(req, res, next) {
	req.session.gdpr = req.session.gdpr || 0;
	req.session.flagkeys = req.session.flagkeys || {};
	return next();
});

/* GDPR... */
app.get('/gdpr', (req, res) => {
	res.send(twing.render('gdpr.twig', {'gdpr':req.session.gdpr}));
});
app.post('/gdpr_accept', (req, res) => {
	req.session.gdpr = 1;
	res.redirect('/');
});

/* Preferable with a handler here as it
	makes the web application a litte bit more generic. */
app.post('*', function(req, res, next) {
	if (req.session.gdpr == 0 && req.path !== '/gdpr_accept') {
		return res.redirect('/gdpr');
	}
	return next();
})

/* The real stuff */
app.get('/', (req, res) => { res.redirect('/level/0'); });
app.use('/level', require('./levels.js'));
app.use('/wp-admin', require('./fakewp.js'));

const port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log('Node.js Express server listening on port ' + port);
});
