/**
 * The **User Group Web API** allows administrators to create, modify or delete user groups. Users with basic privilege level are only allowed to use `GetGroups` API, rests are denied.
 *
 * There are two system built-in (READ ONLY) groups:
 * - __Admin__: Administrators with highest privilege level.
 * - __User__: All users with basic privilege level.
 *
 * @apiClass User Group API
 * @apiVersion 1.00
 * @apiBasePath /api/v1
 */

var config   = require('config'),
    express  = require('express'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    User     = require('models/user'),
    Group    = require('models/group');

var router = express.Router();

// Check and create default groups
Group.find(function(err, groups) {
  if (err)
    throw new Error('Error occurred while finding default groups');

  if (groups.length > 0)
    console.log('User groups found');
  else {
    console.log('Createing default groups');
    [ 'Admin', 'User' ].concat(config.settings.group).forEach(function(group) {
      var g = new Group({ name: group });
      g.save();
    });
  }
});

/**
 * Get group list or searching group.
 *
 * @apiMethod GetGroups {GET} /group
 * @apiOption {String} searches Key words for searching group.
 *
 * @apiReturn 200 {Array} groups An array object of groups.
 * @apiReturn 500 (Error while loading groups)
 */
router.get('/', function(req, res) {
  var conds = {};

  if (req.query.searches) {
    var pattern = req.query.searches.replace(/\ ,/g, '|');
    var regex = new RegExp(pattern, 'ig');
    conds = { name: regex };
  }

  Group.find(conds, function(err, groups) {
    if (err)
      res.status(500).send('Error while loading groups: ' + err);
    else
      res.json(groups.map(g => g.name));
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
 * Add a new group.
 *
 * @apiMethod AddGroup {POST} /group
 * @apiReqBody {Object} formdata `FormData` object built with group name:
 * ```
 * {
 *   groupName: groupNameToCreate
 * }
 * ```
 * @apiReturn 200 (Group created)
 * @apiReturn 401 (User authorization required)
 * @apiReturn 403 (Administrative privilege required)
 * @apiReturn 405 (Special characters not allowed)
 * @apiReturn 409 (Group name already exists)
 * @apiReturn 500 (Error while loading group)
 */
router.post('/', function(req, res) {
  if (/[`~,.<>\-;':"/[\]|{}()=+!@#$%^&*]/.test(req.body.groupName))
    return res.status(405).send('Special characters not allowed');

  Group.find({ name: req.body.groupName } , function(err, groups) {
    if (err)
      res.status(500).send('Error while loading group: ' + err);
    else if (groups.length > 0)
      res.status(409).send('Group name already exists');
    else {
      var g = new Group({ name: req.body.groupName });
      g.save();
      res.status(200).send('Group created');
    }
  });
});

/**
 * **`[Administrative Privilege Required]`**
 *
 * Rename a group.
 *
 * @apiMethod RenameGroup {PUT} /group
 * @apiReqBody {Object} formdata `FormData` object built with group name:
 * ```
 * {
 *   groupName: newGroupName
 * }
 * ```
 * @apiReturn 200 (Group name update)
 * @apiReturn 401 (User authorization required)
 * @apiReturn 403 (Administrative privilege required)
 * @apiReturn 405 (Special characters not allowed)
 * @apiReturn 409 (New group name already exists)
 * @apiReturn 500 (Error while loading group)
 * @apiReturn 500 (Error while updating group name)
 */
router.put('/', function(req, res) {
  if (/[`~,.<>\-;':"/[\]|{}()=+!@#$%^&*]/.test(req.body.groupNameNew))
    return res.status(405).send('Special characters not allowed');

  Group.find({ name: req.body.groupName }, function(err, groups) {
    if (err)
      res.status(500).send('Error while loading group: ' + err);
    else if (groups.length > 0) {
      Group.find({ name: req.body.groupNameNew }, function(err, groups) {
        if (err)
          res.status(500).send('Error while loading group: ' + err);
        else if (groups.length > 0)
          res.status(409).send('New group name already exists');
        else {
          Group.update(
            { name: req.body.groupName },
            { $set: { name: req.body.groupNameNew } },
            function(err) {
              if (err)
                res.status(500).send('Error while updating group name: ' + err);
              else
                res.status(200).send('Group name update');
            }
          );
        }
      });
    }
    else
      res.status(404).send('Group name not found');
  });
});

/**
 * **`[Administrative Privilege Required]`**
 *
 * Remove a group.
 *
 * @apiMethod RemoveGroup {DELETE} /group/`:name`
 * @apiParam {String} name Group name to be removed.
 *
 * @apiReturn 200 (Group removed)
 * @apiReturn 401 (User authorization required)
 * @apiReturn 403 (Administrative privilege required)
 * @apiReturn 404 (Group not found)
 * @apiReturn 500 (Error while loading group)
 * @apiReturn 500 (Error while removing group)
 */
router.delete('/:name', function(req, res) {
  Group.find({ name: req.params.name }, function(err, groups) {
    if (err)
      res.status(500).send('Error while loading group: ' + err);
    else if (groups.length > 0) {
      Group.remove({ name: groups[0].name }, function(err) {
        if (err)
          res.status(500).send('Error while removing group: ' + err);
        else
          res.status(200).send('Group removed');
      });
    }
    else
      res.status(404).send('Group not found');
  });
});

module.exports = router;
