var express = require('express'),
    config  = require('config');

var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.redirect('/apps/ia/' + config.settings.portal + '/');
});

module.exports = router;
