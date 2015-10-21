/**
 * The **Instrument Control Web API**
 *
 * @apiClass Instrument Control API
 * @apiVersion 1.00
 * @apiBasePath /api/v1
 */

var express  = require('express');
var inst = require('instrument-com');


var router = express.Router();

router.use(function(req, res, next) {
  console.log('%s %s %s', req.method, req.url, req.path);
  next();

});

//router.use('/dso', require('./api-instrument-dso'));
/**
 *
 * List Available USB Device.
 *
 * @apiMethod GetUsbDeviceList {Get} /instrument
 * @apiReturn 200 {Object} Object array store available device information:
 * ```
 * {
 *   deviceName:[],
 *   manufacturer:[],
 *   serialNumber:[],
 *   vendorId:[],
 *   productId:[]
 * }
 * ```
 */
router.get('/', function(req, res) {
  console.log('get request');
  console.log(req.params);
  console.log(req.body);
  console.log(req.query);
  var usbDev = inst.getUsbDevice();
  console.log(usbDev);
  res.status(200).send(usbDev);
});
/**
 *
 * Create Instrument Driver Instance.
 *
 *
 * @apiMethod CreadeDriver {POST} /instrument
 * @apiReqBody {Object} devInfo `devInfo` object :
 * ```
 * devInfo: {
 *    deviceName:[],
 *    manufacturer:[],
 *    serialNumber:[],
 *    vendorId:[],
 *    productId:[]
 * }
 * ```
 * @apiReturn 200 {String} Id Instrument ID
 * @apiReturn 404 (Device not exist)
 * @apiReturn 409 (Device already connected)
 */
router.post('/', function(req, res) {
  console.log('post request');
  inst.connectUsbDevice(req.body.devInfo,function(err,id){
    if(err){
      console.log(err);
      res.status(err[0]).send(err[1]);
    }
    else{
      res.status(200).send(id);
    }
  });
});
router.get('/:id/run', function(req, res) {
  // console.log(req.params.id+'get run request');
  var devDriv=inst.getDevDriver(req.params.id);

  res.status(200).send('ok');

});
router.put('/:id/run', function(req, res) {
  var devDri=inst.getDevDriver(req.params.id);
  if(devDri){
    if(devDri.run){
      devDri.run()
        .then(function(){
          res.status(200).send('ok');
        })
        .catch(function(err){
          res.status(err[0]).send(err[1]);
        });
    }
    else{
      res.status(501).send('Not Implemented');
    }
  }
  else{
    res.status(404).send('ID Not Found');
  }
});
module.exports = router;
