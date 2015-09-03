var express  = require('express'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    User     = require('../models/user');

var router = express.Router();

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

mongoose.connect('mongodb://localhost:27017/user');

router.post('/signup', function(req, res, next) {
  User.register(
    new User({
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
  //res.cookie('userid', req.user.id, { maxAge: 600000, httpOnly: false, secure: false });
  //client: $.cookie("userid")
  res.status(200).send('User logged in');
});

router.get('/logout', function(req, res) {
  //res.clearCookie('userid');
});

module.exports = router;
