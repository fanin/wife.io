var express = require('express'),
    fs      = require('fs'),
    path    = require('path');

var router = express.Router();

var API_VERSION = 1,
    API_PATH = path.join(__dirname, '/api/v' + API_VERSION);

router.use('/v' + API_VERSION + '/user',  require(API_PATH + '/api-user'));
router.use('/v' + API_VERSION + '/group', require(API_PATH + '/api-group'));
router.use('/v' + API_VERSION + '/asset', require(API_PATH + '/api-asset'));
router.use('/v' + API_VERSION + '/fs',    require(API_PATH + '/api-fs'));
router.use('/v' + API_VERSION + '/instrument',    require(API_PATH + '/api-instrument'));

router.use(function(req, res, next) {
  if (req.method === 'GET')
    next();
  else {
    // TODO: Check user permission
    if (req.user)
      next();
    else
      res.status(401).send('User authorization required');
  }
});

router.use('/v' + API_VERSION + '/app',     require(API_PATH + '/api-app'));
router.use('/v' + API_VERSION + '/storage', require(API_PATH + '/api-storage'));

module.exports = router;
