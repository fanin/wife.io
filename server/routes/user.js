var config   = require('config'),
    express  = require('express'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    User     = require('../models/user');

var router = express.Router();

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

mongoose.connect('mongodb://localhost:27017/user');

// Check and create default admin account
User.find({ email: config.settings.admin.email }, function(err, admins) {
  if (err)
    throw new Error('Error occurred while finding admin account');

  if (admins.length > 0)
    console.log('Admin account found');
  else {
    console.log('Creating default admin account');
    User.register(new User({
        email: config.settings.admin.email,
        firstname: config.settings.admin.firstname,
        lastname: config.settings.admin.lastname,
        group: config.settings.admin.group,
        gender: config.settings.admin.gender
      }),
      config.settings.admin.password,
      function(error, admin) {
        if (error)
          throw new Error('Unable to create admin account');
      }
    );
  }
});

router.post('/signup', function(req, res, next) {
  User.register(new User({
      email:     req.body.email,
      firstname: req.body.firstname,
      lastname:  req.body.lastname,
      group:     req.body.group,
      gender:    req.body.gender
    }),
    req.body.password,
    function(error, user) {
      if (error)
        res.status(403).send(error.message);
      else
        res.status(200).send('User account created');
    }
  );
});

router.post('/login', passport.authenticate('local'), function(req, res) {
  res.cookie('userid', req.user.id, { maxAge: 600000, httpOnly: false, secure: false });
  //client: $.cookie("userid")
  res.status(200).send('User logged in');
});

router.get('/logout', function(req, res) {
  req.logout();
  res.clearCookie('userid');
  res.sendStatus(200);
});

router.put('/password', passport.authenticate('local'), function(req, res) {
  User.findById(req.user.id, function(err, user) {
    if (err)
      res.status(500).send('Failed to update password, error: ' + err);
    else
      user.setPassword(req.body.newPassword, function(err) {
        if (err)
          res.status(500).send('Failed to update password, error: ' + err);
        else {
          user.save();
          res.status(200).send('User password updated');
        }
      });
  });
});

router.get('/profile', function(req, res) {
  if (req.user) {
    User.findById(req.user.id, function(err, user) {
      res.json(user);
    });
  }
  else
    res.sendStatus(401);
});

router.put('/profile', passport.authenticate('local'), function(req, res) {
  User.update({
    email: req.body.email
  }, {
    firstname: req.body.firstname,
    lastname:  req.body.lastname,
    group:     req.body.group,
    gender:    req.body.gender
  }, function(err) {
    if (err)
      res.status(500).send('Failed to update user profile, error: ' + err);
    else
      res.status(200).send('User profile updated');
  });
});

module.exports = router;
