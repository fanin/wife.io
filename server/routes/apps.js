var express = require('express'),
    fs      = require('fs-extra'),
    path    = require('path'),
    url     = require('url'),
    config  = require('config');

var router = express.Router();

function handleAppUrl(req, res) {
  var app_path, file_path,
      apptype  = req.params.apptype,
      appname  = req.params.appname,
      filename = path.normalize(url.parse(req.url, true).pathname);

  if (apptype === 'ia') {
    filename  = filename.replace('ia' + path.sep, '');

    if (fs.existsSync(path.join(config.settings.user_data_path, config.settings.sys_name, 'apps/index.html'))) {
      app_path  = path.join(config.settings.user_data_path, config.settings.sys_name, 'apps', appname);
      file_path = path.join(config.settings.user_data_path, config.settings.sys_name, 'apps', filename);
    }
    else {
      app_path  = path.join(config.settings.root_path, 'apps', appname);
      file_path = path.join(config.settings.root_path, 'apps', filename);
    }
  }
  else if (apptype === 'ua') {
    filename  = filename.replace('ua' + path.sep, '');
    app_path  = path.join(config.settings.user_data_path, config.settings.sys_name, 'apps', appname);
    file_path = path.join(config.settings.user_data_path, config.settings.sys_name, 'apps', filename);
  }
  else {
    res.sendStatus(404);
    return;
  }

  fs.exists(file_path, function(exists) {
    if (exists) {
      if (path.basename(file_path) === 'app.js') {
        var manifest = fs.readJsonSync(path.join(app_path, 'manifest.json'));
        res.cookie('appid', manifest.identifier, { maxAge: 600000, httpOnly: true, secure: false });
      }
      res.sendFile(file_path);
    }
    else {
      if (path.basename(file_path) === 'icon.png')
        res.sendFile(path.join(config.settings.root_path, 'public/img/unknown-icon.png'));
      else
        res.sendStatus(404);
    }
  });

  //var url = '/' + req.params.apptype + '/' + req.params.appname + '/';
}

router.get('/:apptype/:appname/', function(req, res, next) {
  handleAppUrl(req, res);
});

router.get('/:apptype/:appname/*', function(req, res, next) {
  handleAppUrl(req, res);
});

module.exports = router;
