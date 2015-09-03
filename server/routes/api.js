var express = require('express'),
    fs      = require('fs'),
    path    = require('path');

var router = express.Router();

var API_VERSION = 1,
    API_PATH = path.join(__dirname, '/api/v' + API_VERSION);

router.use(function(req, res, next) {
  if (req.method === 'GET')
    next();
  else {
    // TODO: Check user permission
    if (req.user)
      next();
    else
      res.sendStatus(401);
  }
});

router.use('/v' + API_VERSION + '/apps',    require(API_PATH + '/api-apps'));
router.use('/v' + API_VERSION + '/fs',      require(API_PATH + '/api-fs'));
router.use('/v' + API_VERSION + '/storage', require(API_PATH + '/api-storage'));

module.exports = router;
