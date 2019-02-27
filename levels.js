const Router = require('express').Router();
var hasher = require('node-object-hash');
const crypto = require("crypto");

const {TwingEnvironment, TwingLoaderFilesystem} = require('twing');
const loader = new TwingLoaderFilesystem('./templates');
const twing = new TwingEnvironment(loader);

const solutions = {
	0: '60918e5160b34b0d616e94b9886e2c471798f9f38f57107e801b2752b3e386de',
	1: 'bf16cd6fbf0b3a647fc70468e6165d61941cbff073c17e658ba71441b86c50f0',
	2: '1b7e2111573970fde1d39b787b2e6c72645bf6ab3d74dca0f6931274d22fbe9d',
	3: 'e1a44f8db14d3e178a0ab51bd3755b4a7bab95a420f1673aee1644375a074691',
	4: '485737375bb26eac27648e9302921e9356987cc07a54f35646e497a859e54ab8',
	7: '0685f72a0e0f9cd86d0b812155daf4d2389fe659b483d0f3e54a409d3b9d119f',
}

const flags = {
	/* Flags for some levels. ID based on URL. */
	0: 'EnFlygandeStart',
	1: 'AnkeborgVäntarDig',
	6: 'DåligtMedKakorDetHärMedWordpress',
	7: 'DuKommerHalvvägsMed21',
}

Router.use('/:level', (req, res, next) => {
	req.session.level = req.session.level || 0;
	var level = parseInt(req.params.level);

	if (level <= req.session.level) {
		return next();
	}
	else if (req.session.level == 8 && level == 9) {
		req.session.level = 9;
		return next();
	}
	else {
		res.redirect('/level/' + req.session.level);
	}
});

Router.get('/:level', (req, res) => {
	var level = parseInt(req.params.level);
	var flag;

	if (req.session.flagkeys[level] === undefined) {
		req.session.flagkeys[level] = crypto.randomBytes(10).toString('hex');
	}

	if (flags[level-1]) {
		flag = Buffer.from(flags[level-1]+"."+req.session.flagkeys[level-1]).toString('base64');
	}

	res.setHeader('Server', 'Apache');

	//console.log(req.session.flagkeys);

	res.send(twing.render('level' + level + '.twig', {
		'lvl': req.session.level,
		'visitedlvl':level,
		'gdpr': req.session.gdpr,
		'flag': flag
	}));
});

Router.get('/9', (req, res) => {
	res.send(twing.render('level' + level + '.twig', {
		'lvl': req.session.level,
		'visitedlvl':9,
		'gdpr': 1
	}));
});

// If the provided body can be verified by comparing it to a hash then this function will.
// If not it will pass it along to a problem specific handler.
Router.post('/:level', (req, res, next) =>
{
	req.params.level = parseInt(req.params.level);

	if (req.params.level < req.session.level || req.params.level > req.session.level) {
		return next();
	}

	if (solutions[req.params.level] != null) {
		var hash = hasher().hash(req.body);
		//console.log(hash);
		if (hash === solutions[req.params.level]) {
			req.session.level++;
		}
	} else {
		return next();
	}
	res.redirect('/level/' + req.session.level);
});

Router.post('/5', (req, res) =>
{
	if (req.body.key === 'YWxsCnlvdXIKY29va2llcwphcmUKYmVsb25nCnRvCnVz')
	{
		if (req.session.level == 5) req.session.level++;
		res.cookie('connect.sid', '');
		res.redirect('/level/6');
	} else {
		res.send('jag gav dig nyckeln...');
  }
});

Router.post('/6', (req, res) =>
{
	const sqlite3 = require('sqlite3').verbose();

	let db = new sqlite3.Database('./level6.db', (err) => {
		if (err) {
			return console.error(err.message);
		}
	});

	let sql = `SELECT * FROM users WHERE username = '`+req.body.username+`' AND password='`+req.body.password+`'`;

	db.all(sql, [], (err, rows) => {
		//if (err) {}
		if (rows.length > 0) {
			if (req.session.level == 6) req.session.level++;
		}
	});

	// close the database connection
	db.close((err) => {
		if (err) {
			return console.error(err.message);
		}
		res.redirect('/level/' + req.session.level);
	});
});

Router.post('/8', (req, res) =>
{
	res.redirect('/level/8');
});

module.exports = Router;
