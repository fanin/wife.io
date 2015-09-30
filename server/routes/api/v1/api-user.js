/**
 * The **User Account Web API** provides user signup, login, logout and profile editing APIs for all users. A set of privileged APIs (with the API name prefix `Adm`) are provided as well for administrators to manage all user accounts.
 *
 * @apiClass User Account API
 * @apiVersion 1.00
 * @apiBasePath /api/v1
 */

var config   = require('config'),
    express  = require('express'),
    passport = require('passport')
    assign   = require('object-assign'),
    User     = require('models/user'),
    Group    = require('models/group');

var router = express.Router();

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

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
        gender: config.settings.admin.gender,
        active: true
      }),
      config.settings.admin.password,
      function(error, admin) {
        if (error)
          throw new Error('Unable to create admin account');
      }
    );
  }
});

/**
 * Create an user account.
 *
 * @apiMethod SignUp {POST} /user/signup
 * @apiReqBody {Object} formdata `FormData` object built with user signup info:
 * ```
 * {
 *   email: 'walter@wife.io',
 *   password: 'breakingbad',
 *   firstname: 'Walter',
 *   lastname: 'White',
 *   group: 'User,Cooker',
 *   gender: true // true: male, false: female
 * }
 * ```
 * @apiReturn 200 (User account created)
 * @apiReturn 403 {String} error Error message returned while creating account.
 */
router.post('/signup', function(req, res, next) {
  User.register(new User({
      email:     req.body.email,
      firstname: req.body.firstname,
      lastname:  req.body.lastname,
      group:     req.body.group,
      gender:    req.body.gender,
      active:    true
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

/**
 * Login to the system with user account.
 *
 * @apiMethod Login {POST} /user/login
 * @apiReqBody {Object} formdata `FormData` object built with user authentication info:
 * ```
 * {
 *   email: 'walter@wife.io',
 *   password: 'breakingbad'
 * }
 * ```
 *
 * @apiReturn 200 (User logged in)
 * @apiReturn 503 (User account deactivated)
 * @apiReturn 4xx/5xx Login error reported from `Passport` module.
 */
router.post('/login', passport.authenticate('local'), function(req, res) {
  res.cookie('userid', req.user.id, { maxAge: 600000, httpOnly: false, secure: false });
  //client: $.cookie("userid")
  if (req.user.active)
    res.status(200).send('User logged in');
  else
    res.status(503).send('User account deactivated');
});

//
// Security barrier for APIs which require user to log in
//
router.use(function(req, res, next) {
  if (req.user && req.user.active)
    next();
  else
    res.status(401).send('User authorization required');
});

/**
 * Logout from the system.
 *
 * @apiMethod Logout {GET} /user/logout
 * @apiReturn 200 (User logged out)
 * @apiReturn 401 (User authorization required)
 */
router.get('/logout', function(req, res) {
  req.logout();
  res.clearCookie('userid');
  res.status(200).send('User logged out');
});

/**
 * Update user password.
 *
 * @apiMethod UpdatePassword {PUT} /user/password
 * @apiReqBody {Object} formdata `FormData` object built with user email, password and new password:
 * ```
 * {
 *   email: 'walter@wife.io',
 *   password: 'breakingbad',
 *   newPassword: 'saymyname'
 * }
 * ```
 *
 * @apiReturn 200 (User password updated)
 * @apiReturn 401 (User authorization required)
 * @apiReturn 4xx/5xx Failed to update password with error reported from `Passport` module.
 */
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

/**
 * Get specific user profile or search users. An user profile object can look like this:
 * ```
 * {
 *     email: 'walter@wife.io',
 *     firstname: 'Walter',
 *     lastname: 'White',
 *     group: 'User,Cooker',
 *     gender: true
 * }
 * ```
 * Note that the user's password is not visible in the object.
 *
 * For given no option, this API returns profile object of current logged in user.
 * For given `email` option only, this API returns profile object of user who owns the given email.
 * For given `searches` option, this API returns an array of users who matches the key words.
 *
 * @apiMethod GetProfile {GET} /user/profile
 * @apiOption {String} email Email for getting user's profile. If not specified, currently logged in user's profile is returned.
 * @apiOption {String} searches Key words for searching users.
 *
 * @apiReturn 200 {Object} profile User profile object.
 * @apiReturn 200 {Array} users Users that match the search key words.
 * @apiReturn 401 (User authorization required)
 * @apiReturn 404 (User not found)
 * @apiReturn 500 (Failed to get user profile)
 */
router.get('/profile', function(req, res) {
  var conds;

  if (req.query.searches) {
    var pattern = req.query.searches.replace(/\ ,/g, '|');
    var regex = new RegExp(pattern, 'ig');
    conds = { $or:[
      { email: regex },
      { firstname: regex },
      { lastname: regex },
      { group: regex }
    ] };
  }
  else {
    conds = { email: req.query.email || req.user.email };
  }

  User.find(conds, function(err, users) {
    if (err)
      res.status(500).send('Failed to get user profile, error: ' + err);
    else {
      if (req.query.searches)
        res.json(users);
      else {
        if (users.length > 0)
          res.json(users[0]);
        else
          res.status(404).send('User not found');
      }
    }
  });
});

/**
 * Update user profile.
 *
 * @apiMethod SetProfile {PUT} /user/profile
 * @apiReqBody {Object} formdata `FormData` object built with user profile as well as login info:
 * ```
 * {
 *   email: 'walter@wife.io',
 *   password: 'breakingbad',
 *   firstname: 'Walter',
 *   lastname: 'White',
 *   group: 'User,Teacher',
 *   gender: true
 * }
 * ```
 * Note that `email` and `password` fields are used to authenticate the user before updating profile.
 *
 * @apiReturn 200 (User profile updated)
 * @apiReturn 401 (User authorization required)
 * @apiReturn 403 (User authentication failed)
 * @apiReturn 500 (Failed to update user profile)
 */
router.put('/profile', passport.authenticate('local'), function(req, res) {
  User.update({
    email: req.body.email
  }, {
    $set: {
      firstname: req.body.firstname,
      lastname:  req.body.lastname,
      group:     req.body.group,
      gender:    req.body.gender
    }
  }, function(err) {
    if (err)
      res.status(500).send('Failed to update user profile, error: ' + err);
    else
      res.status(200).send('User profile updated');
  });
});

/**
 * Deactivate user account.
 *
 * @apiMethod Deactivate {DELETE} /user/profile
 * @apiReqBody {Object} formdata `FormData` object built with user authentication info:
 * ```
 * {
 *   email: 'walter@wife.io',
 *   password: 'breakingbad'
 * }
 * ```
 *
 * @apiReturn 200 (User account deactivated)
 * @apiReturn 401 (User authorization required)
 * @apiReturn 500 (Failed to deactivate user)
 */
router.delete('/profile', passport.authenticate('local'), function(req, res) {
  User.update({
    email: req.user.email
  }, {
    $set: { active: false }
  }, function(err) {
    if (err)
      res.status(500).send('Failed to deactivate user, error: ' + err);
    else
      res.status(200).send('User account deactivated');
  });
});


//
// Security barrier for administrative privilege APIs
//
router.use(function(req, res, next) {
  if (req.user.group.split(',').indexOf('Admin') < 0)
    return res.status(403).send('Administrative privilege required');
  else
    next();
});

/**
 * **`[Administrative Privilege Required]`**
 *
 * Get all users.
 *
 * @apiMethod AdmGetList {GET} /user
 *
 * @apiReturn 200 {Array} users Array of user profiles.
 * @apiReturn 403 (Administrative privilege required)
 * @apiReturn 500 (Failed to get user profiles)
 */
router.get('/adm/list', function(req, res) {
  User.find(function(err, users) {
    if (err)
      res.status(500).send('Failed to get user profiles, error: ' + err);
    else
      res.json(users);
  });
});

/**
 * **`[Administrative Privilege Required]`**
 *
 * Update user profile with no authentication required for administrators.
 *
 * @apiMethod AdmSetProfile {PUT} /user/adm/profile
 * @apiReqBody {Object} formdata `FormData` object built with user profile:
 * ```
 * {
 *   email: 'walter@wife.io',
 *   firstname: 'Walter',
 *   lastname: 'White',
 *   group: 'Teacher',
 *   gender: true,
 *   active: true
 * }
 * ```
 * Note that `password` field is not required for administrators.
 *
 * @apiReturn 200 (User profile updated)
 * @apiReturn 403 (Administrative privilege required)
 * @apiReturn 404 (User not found)
 * @apiReturn 500 (Failed to get user profile)
 * @apiReturn 500 (Failed to update user profile)
 */
router.put('/adm/profile', function(req, res) {
  User.find({ email: req.body.email }, function(err, users) {
    if (err)
      res.status(500).send('Failed to get user profile, error: ' + err);
    else if (users.length > 0) {
      var fields = {};

      if (req.body.firstname)
        fields = assign(fields, { firstname: req.body.firstname });
      if (req.body.lastname)
        fields = assign(fields, { lastname: req.body.lastname });
      if (req.body.group)
        fields = assign(fields, { group: req.body.group });
      if (req.body.gender !== undefined)
        fields = assign(fields, { gender: req.body.gender });
      if (req.body.active !== undefined)
        fields = assign(fields, { active: req.body.active });

      User.update({ email: req.body.email }, { $set: fields }, function(err) {
        if (err)
          res.status(500).send('Failed to update user profile, error: ' + err);
        else
          res.status(200).send('User profile updated');
      });
    }
    else
      res.status(404).send('User not found');
  });
});

/**
 * **`[Administrative Privilege Required]`**
 *
 * Deactivate or permanently delete user account with no authentication required for administrators.
 *
 * @apiMethod AdmDeactivate {DELETE} /user/adm/profile
 * @apiOption {Boolean} delete Set to `1` to permanently delete user account.
 * @apiOption {String} email Email of user account to deactivate or delete.
 *
 * @apiReturn 200 (User account deactivated)
 * @apiReturn 200 (User account deleted)
 * @apiReturn 403 (Administrative privilege required)
 * @apiReturn 404 (User not found)
 * @apiReturn 500 (Failed to get user profile)
 * @apiReturn 500 (Failed to deactivate user)
 * @apiReturn 500 (Failed to delete user)
 */
router.delete('/adm/profile', function(req, res) {
  User.find({ email: req.query.email }, function(err, users) {
    if (err)
      res.status(500).send('Failed to get user profile, error: ' + err);
    else if (users.length > 0) {
      if (req.query.delete == 1) {
        User.remove({
          email: req.query.email
        }, function(err) {
          if (err)
            res.status(500).send('Failed to delete user, error: ' + err);
          else
            res.status(200).send('User account deleted');
        });
      }
      else {
        User.update({
          email: req.query.email
        }, {
          $set: { active: false }
        }, function(err) {
          if (err)
            res.status(500).send('Failed to deactivate user, error: ' + err);
          else
            res.status(200).send('User account deactivated');
        });
      }
    }
    else
      res.status(404).send('User not found');
  });
});

module.exports = router;
