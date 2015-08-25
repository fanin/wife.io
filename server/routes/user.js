var express  = require('express'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    User     = require('../models/user');

var router = express.Router();

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

mongoose.connect('mongodb://localhost:27017/user');

router.get('/register', function(req, res) {

});

router.post('/register', function(req, res) {
  User.register(new User({ email : req.body.email }), req.body.password, function(err, account) {
    if (err) {
      return res.render('register', { account : account });
    }

    passport.authenticate('local')(req, res, function() {
      res.redirect('/');
    });
  });
});

router.get('/login', function(req, res) {

});

router.post('/login', passport.authenticate('local'), function(req, res) {

});

router.get('/logout', function(req, res) {

});

module.exports = router;
