var User = require('models/user');

module.exports = {
  grant: function(req, res, next) {
    if (req.method === 'GET') {
      next();
    }
    else if (!req.user) {
      res.status(403).send('Anonymous users');
    }
    else {
      User.findById(req.user.id, function(err, user) {
        if (err)
          res.status(500).send('Unable to get user profile');
        else
          next();
      });
    }
  }
}
