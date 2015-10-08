/**
 * The **Asset Management Web API** allows administrators to probe, create, modify and delete assets.
 *
 * @apiClass Asset API
 * @apiVersion 1.00
 * @apiBasePath /api/v1
 */

var config   = require('config'),
    express  = require('express'),
    User     = require('models/user'),
    Asset    = require('models/asset');

var router = express.Router();

/**
 * Get assets list or one specified asset object.
 *
 * @apiMethod GetAsset {GET} /asset/`:assetid`
 * @apiParam {String} assetid Asset ID. Leave this param empty to get all assets.
 *
 * @apiReturn 200 {Array} assets Assets list.
 * @apiReturn 200 {Object} asset Asset object with given serial ID.
 * @apiReturn 404 (Given asset ID not found)
 * @apiReturn 500 (Error while loading asset)
 */
router.get('/:assetid', function(req, res) {
  var cond = req.params.assetid ? { assetid: req.params.assetid } : {};

  Asset.find(cond, function(err, assets) {
    if (err)
      res.status(500).send('Error while loading asset');
    else if (req.params.assetid) {
      if (assets.length > 0)
        res.json(assets[0]);
      else
        res.status(404).send('Given asset ID not found');
    }
    else
      res.json(assets);
  });
});

//
// Security barrier for administrative privilege APIs
//
router.use(function(req, res, next) {
  if (req.user && req.user.active) {
    if (req.user.group.split(',').indexOf('Admin') >= 0)
      next();
    else
      res.status(403).send('Administrative privilege required');
  }
  else
    res.status(401).send('User authorization required');
});

/**
 * **`[Administrative Privilege Required]`**
 *
 * Add a new asset.
 *
 * @apiMethod AddAsset {POST} /asset
 * @apiReqBody {Object} formdata `FormData` object built with asset object:
 * ```
 * {
 *   assetid: 'IT00000001'
 *   serial: '0000-0001-234567',
 *   name: 'NB0001',
 *   type: 'PC',
 *   vendor: 'Apple',
 *   model: 'Macbook Pro 2015',
 *   owner: 'admin@wife.io',
 *   acquisition_date: 'Jan 01, 2015',
 *   warranty_expiration_date: 'Jan 01, 2020',
 *   description: 'Kenny\'s macbook pro 15" with retina display'
 * }
 * ```
 * @apiReturn 200 (Asset created)
 * @apiReturn 401 (User authorization required)
 * @apiReturn 403 (Administrative privilege required)
 * @apiReturn 409 (Asset ID already exists)
 * @apiReturn 500 (Error while loading asset)
 */
router.post('/', function(req, res) {
  Asset.find({ assetid: req.body.assetid } , function(err, assets) {
    if (err)
      res.status(500).send('Error while loading asset: ' + err);
    else if (assets.length > 0)
      res.status(409).send('Asset ID already exists');
    else {
      var a = new Asset({
        assetid: req.body.assetid,
        serial: req.body.serial,
        name: req.body.name,
        vendor: req.body.vendor,
        model: req.body.model,
        owner: req.body.owner,
        acquisition_date: req.body.acquisition_date,
        warranty_expiration_date: req.body.warranty_expiration_date,
        description: req.body.description
      });
      a.save();
      res.status(200).send('Asset created');
    }
  });
});

/**
 * **`[Administrative Privilege Required]`**
 *
 * Update an asset.
 *
 * @apiMethod UpdateAsset {PUT} /asset/`:assetid`
 * @apiParam {String} assetid Asset ID to update.
 * @apiReqBody {Object} formdata `FormData` object built with asset object:
 * ```
 * {
 *   assetid: 'IT00000002',
 *   serial: '0000-0001-234567',
 *   name: 'NB0002',
 *   type: 'PC',
 *   vendor: 'Apple Inc.',
 *   model: 'Macbook Pro 2015 Retina',
 *   owner: 'kenny@wife.io',
 *   acquisition_date: 'Jan 01, 2015',
 *   warranty_expiration_date: 'Jan 01, 2020',
 *   description: 'Kenny's macbook pro 15" with retina display'
 * }
 * ```
 *
 * @apiReturn 200 (Asset updated)
 * @apiReturn 403 (Administrative privilege required)
 * @apiReturn 404 (Asset not found)
 * @apiReturn 500 (Error while loading asset)
 * @apiReturn 500 (Error while updating asset)
 */
router.put('/asset/:assetid', function(req, res) {
  if (!req.params.assetid) {
    res.status(404).send('Asset not found');
    return;
  }

  Asset.find({ assetid: req.params.assetid }, function(err, assets) {
    if (err)
      res.status(500).send('Error while loading asset, error: ' + err);
    else if (assets.length > 0) {
      var fields = {
        assetid: req.body.assetid,
        serial: req.body.serial,
        name: req.body.name,
        vendor: req.body.vendor,
        model: req.body.model,
        owner: req.body.owner,
        acquisition_date: req.body.acquisition_date,
        warranty_expiration_date: req.body.warranty_expiration_date,
        description: req.body.description
      };

      Asset.update({ assetid: req.params.assetid }, fields, function(err) {
        if (err)
          res.status(500).send('Error while updating asset, error: ' + err);
        else
          res.status(200).send('Asset updated');
      });
    }
    else
      res.status(404).send('Asset not found');
  });
});

/**
 * **`[Administrative Privilege Required]`**
 *
 * Remove an asset.
 *
 * @apiMethod RemoveAsset {DELETE} /asset/`:assetid`
 * @apiParam {String} assetid Asset ID to remove.
 *
 * @apiReturn 200 (Asset removed)
 * @apiReturn 401 (User authorization required)
 * @apiReturn 403 (Administrative privilege required)
 * @apiReturn 404 (Asset not found)
 * @apiReturn 500 (Error while loading asset)
 * @apiReturn 500 (Error while removing asset)
 */
router.delete('/:assetid', function(req, res) {
  if (!req.params.assetid) {
    res.status(404).send('Asset not found');
    return;
  }

  Asset.find({ assetid: req.params.assetid }, function(err, assets) {
    if (err)
      res.status(500).send('Error while loading asset: ' + err);
    else if (assets.length > 0) {
      Asset.remove({ assetid: req.params.assetid }, function(err) {
        if (err)
          res.status(500).send('Error while removing asset: ' + err);
        else
          res.status(200).send('Asset removed');
      });
    }
    else
      res.status(404).send('Asset not found');
  });
});

module.exports = router;
