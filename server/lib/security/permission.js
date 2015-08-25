var appmgr = require('../app/app-manager');

function getPermStatus(method, perm) {
  if (!perm) return 403;

  function __getPermByMethod(setting) {
    switch (setting) {
      case 'allow':
        return 200;
      case 'denied':
        return 403;
      case 'prompt':
      default:
        return 300;
    }
  }

  switch (method) {
    case 'POST':
      return __getPermByMethod(perm.POST);
    case 'GET':
      return __getPermByMethod(perm.GET);
    case 'PUT':
      return __getPermByMethod(perm.PUT);
    case 'DELETE':
      return __getPermByMethod(perm.DELETE);
  }

  return 400;
}

module.exports = {
  grant: function(req, res, next) {
    var manifest = appmgr.getManifest(req.cookies.appid);
    var category = req.baseUrl.split('/')[3];
    var method = req.method;
    var status = 400;

    if (!manifest || !manifest.permission) {
      res.sendStatus(404);
      return;
    }

    switch (category) {
    case 'apps':
      status = getPermStatus(method, manifest.permission.apps);
      break;
    case 'storage':
      status = getPermStatus(method, manifest.permission.storage);
      break;
    case 'fs':
      status = getPermStatus(method, manifest.permission.fs);
      break;
    }

    if (status === 200)
      next();
    else
      res.sendStatus(status);
  }
}
