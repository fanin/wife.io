var express  = require('express'),
    fs       = require('fs'),
    path     = require('path'),
    url      = require('url'),
    config   = require('config');

var router = express.Router();

router.get('/*', function(req, res, next) {
    var filename = path.normalize(url.parse(req.url, true).pathname);
    var filepath = path.join(config.settings.root_path, 'public', filename);

    fs.exists(filepath, function(exists) {
        if (exists)
            res.sendFile(filepath);
        else
            res.sendStatus(404);
    });
});

module.exports = router;
