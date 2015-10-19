/**
 * The **Instrument Control Web API**
 *
 * @apiClass Instrument Control API
 * @apiVersion 1.00
 * @apiBasePath /api/v1
 */

var express  = require('express');


var router = express.Router();

/**
 * Get avaiable instrument list.
 *
 * @apiMethod ShowInstrument {GET} /
 *
 * @apiReturn 200 {Array} Instrument list.
 */
router.use(function(req, res, next) {
  console.log('%s %s %s', req.method, req.url, req.path);
  next();

});

router.use('/dso', require('./api-instrument-dso'));

router.get('/', function(req, res) {
  console.log('get request');
  console.log(req.params);
  console.log(req.body);
  console.log(req.query);
  res.status(200).send('get response');
});

module.exports = router;
