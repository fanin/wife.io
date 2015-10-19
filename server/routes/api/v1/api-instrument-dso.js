/**
 * The **DSO Control Web API**
 *
 * @apiClass DSO Control API
 * @apiVersion 1.00
 * @apiBasePath /api/v1/dso
 */

var express  = require('express');
var router = express.Router();
var dsoList = [];

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

router.get('/:id', function(req, res, next) {
  console.log('dso get request');
  console.log(req.params);
  console.log(req.body);
  console.log(req.query);
  res.status(200).send('get response');
});
router.post('/', function(req, res) {
  console.log('dso post request');
  console.log(req.params);
  console.log(req.body);
  res.status(200).send('post response');
});


router.put('/', function(req, res) {
  console.log('dso put request');
  console.log(req.params);
  console.log(req.body);
  res.status(200).send('put response');
});

router.delete('/', function(req, res) {
  console.log('dso delete request');
  console.log(req.params);
  console.log(req.body);
  res.status(200).send('delete response');
});

module.exports = router;
