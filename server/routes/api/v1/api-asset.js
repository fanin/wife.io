/**
 * The **Asset Management Web API** allows administrators to probe, create, modify and delete assets.
 *
 * @apiClass Asset API
 * @apiVersion 1.00
 * @apiBasePath /api/v1
 */

var config = require('config'),
    express = require('express'),
    sendevent = require('sendevent'),
    User = require('models/user'),
    Asset = require('models/asset');

var router = express.Router();

var NetServBrowser = require('lib/netserv/netserv-browser'),
    SSEManager = require('lib/sse/sse-manager');

var events = sendevent('/sse');

SSEManager.register('asset', events);
router.use(events);

var assetBrowser = new NetServBrowser({
  serviceType: NetServBrowser.serviceType('http', 'tcp'),
  onServiceUp: (service) => {
    SSEManager.broadcast(
      "asset", { eventType: 'ServiceUp', service: service }
    );
  },
  onServiceDown: (service) => {
    SSEManager.broadcast(
      "asset", { eventType: 'ServiceDown', service: service }
    );
  }
});

/**
 * Start to discover possible assets on the same subnet.
 * The discovered devices/services will report to client by SSE.
 *
 * @apiMethod StartAssetBrowser {POST} /asset/browser
 */
router.post('/browser', function(req, res) {
  assetBrowser.start();
  res.sendStatus(200);
});

/**
 * Stop discovering assets.
 *
 * @apiMethod StopAssetBrowser {DELETE} /asset/browser
 */
router.delete('/browser', function(req, res) {
  assetBrowser.stop();
  res.sendStatus(200);
});

/**
 * Get assets list or one specified asset object.
 *
 * @apiMethod GetAsset {GET} /asset
 * @apiOption {String} assetid Get asset by this ID.
 * @apiOption {String} searches Key words for searching assets.
 * @apiOption {Number} page *[Pagination]* Get assets that belong to given page. For `page=0` or `undefined`, pagination is disabled and all assets are returned.
 * @apiOption {Number} limit *[Pagination]* Set number of assets per page.
 *
 * @apiReturn 200 {Object} info An object contains asset info as below:
 * ```
 * {
 *   assets: [Asset List of Requested Page],
 *   count: [Total asset count],
 *   page:  [Requested Page Number]
 * }
 * ```
 * For `assetid` unspecified, `assets` field is an one element array, `count` and `page` fields are set to `1` and `0` respectively.
 *
 * @apiReturn 404 (Given asset ID not found)
 * @apiReturn 500 (Error while loading asset)
 */
router.get('/', function(req, res) {
  var conds = {};
  var paginate = {};

  if (req.query.assetid) {
    conds = { assetid: req.query.assetid };
  }
  else {
    if (req.query.searches) {
      var pattern = req.query.searches.replace(/\ ,/g, '|');
      var regex = new RegExp(pattern, 'ig');
      conds = { $or: [
        { assetid: regex },
        { serial: regex },
        { name: regex },
        { vendor: regex },
        { model: regex },
        { owner: regex },
        { acquisition_date: { $eq: new Date(pattern) } },
        { warranty_expiration_date: { $eq: new Date(pattern) } },
        { description: regex }
      ] };
    }

    if (req.query.page > 0) {
      req.query.limit = req.query.limit || PAGINATE_LIMIT;
      paginate = {
        skip: (req.query.page - 1) * req.query.limit,
        limit: req.query.limit
      };
    }
  }

  Asset.find(conds, null, paginate, function(err, assets) {
    if (err)
      res.status(500).send('Error while loading asset, error: ' + err);
    else if (req.query.assetid && assets.length === 0)
      res.status(404).send('Given asset ID not found');
    else {
      Asset.count(conds, function(err, count) {
        if (err)
          res.status(500).send('Error while loading asset, error: ' + err);
        else
          res.json({ assets: assets, count: count, page: req.query.page || 0 });
      });
    }
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
 * @apiReturn 500 (Failed to create asset)
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
      a.save(function(err) {
        if (err)
          res.status(500).send('Failed to create asset, error: ' + err);
        else
          res.status(200).send('Asset created');
      });
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
router.put('/:assetid', function(req, res) {
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
