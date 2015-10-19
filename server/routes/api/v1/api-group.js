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
    [
      {
        name: 'Admin',
        description: 'Administrators'
      },
      {
        name: 'User',
        description: 'All regular users'
      }
    ].concat(config.settings.group).forEach(function(group) {
      var g = new Group(group);
      g.save();
    });
  }
});

/**
 * Get group list or searching group with pagination support.
 *
 * @apiMethod GetGroups {GET} /group
 * @apiOption {String} searches Key words for searching group.
 * @apiOption {Number} page *[Pagination]* Get groups that belong to given page. For `page=0` or `undefined`, pagination is disabled and all users are returned.
 * @apiOption {Number} limit *[Pagination]* Set number of groups per page.
 *
 * @apiReturn 200 {Object} groups An object contains group info as below:
 * ```
 * {
 *    groups: [Group List of Requested Page],
 *    count: [Total group count],
 *    page:  [Requested Page Number]
 * }
 * ```
 * @apiReturn 500 (Error while loading groups)
 */
router.get('/', function(req, res) {
  var conds = {};
  var paginate = {};

  if (req.query.searches) {
    var pattern = req.query.searches.replace(/\ ,/g, '|');
    var regex = new RegExp(pattern, 'ig');
    conds = { $or: [
      { name: regex },
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

  Group.find(conds, null, paginate, function(err, groups) {
    if (err)
      res.status(500).send('Error while loading groups: ' + err);
    else {
      Group.count(conds, function(err, count) {
        if (err)
          res.status(500).send('Failed to get group count, error: ' + err);
        else
          res.json(
            {
              groups: groups.sort((a, b) => {
                if (a.name === 'Admin')
                  return -1;
                else if (b.name === 'Admin')
                  return 1;
                else if (a.name === 'User')
                  return -1;
                else if (b.name === 'User')
                  return 1;
                else
                  return (b - a);
              }),
              count: count,
              page: req.query.page || 0
            }
          );
      });
    }
  });
});

/**
 * Get number of groups.
 *
 * @apiMethod GetCount {GET} /group/count
 * @apiOption {String} searches Key words for searching groups.
 *
 * @apiReturn 200 {Number} count Number of groups.
 * @apiReturn 500 (Failed to get group count)
 */
router.get('/count', function(req, res) {
  var conds = {};

  if (req.query.searches) {
    var pattern = req.query.searches.replace(/\ ,/g, '|');
    var regex = new RegExp(pattern, 'ig');
    conds = { $or: [
      { name: regex },
      { description: regex }
    ] };
  }

  Group.count(conds, function(err, count) {
    if (err)
      res.status(500).send('Failed to get group count, error: ' + err);
    else
      res.json({ count: count });
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
 *   name: nameToCreate,
 *   description: description
 * }
 * ```
 * @apiReturn 200 (Group created)
 * @apiReturn 401 (User authorization required)
 * @apiReturn 403 (Administrative privilege required)
 * @apiReturn 405 (Special characters not allowed)
 * @apiReturn 409 (Group name already exists)
 * @apiReturn 500 (Error while loading group)
 * @apiReturn 500 (Failed to add group)
 */
router.post('/', function(req, res) {
  if (/[`~,.<>\-;':"/[\]|{}()=+!@#$%^&*]/.test(req.body.name))
    return res.status(405).send('Special characters not allowed');

  Group.find({ name: req.body.name } , function(err, groups) {
    if (err)
      res.status(500).send('Error while loading group: ' + err);
    else if (groups.length > 0)
      res.status(409).send('Group name already exists');
    else {
      var g = new Group({
        name: req.body.name,
        description: req.body.description
      });
      g.save(function(err) {
        if (err)
          res.send(500).status('Failed to add group, error: ' + err);
        else
          res.status(200).send('Group created');
      });
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
 *   oldname: oldname
 *   newname: newname
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
  if (/[`~,.<>\-;':"/[\]|{}()=+!@#$%^&*]/.test(req.body.newname))
    return res.status(405).send('Special characters not allowed');

  Group.find({ name: req.body.oldname }, function(err, groups) {
    if (err)
      res.status(500).send('Error while loading group: ' + err);
    else if (groups.length > 0) {
      Group.find({ name: req.body.newname }, function(err, groups) {
        if (err)
          res.status(500).send('Error while loading group: ' + err);
        else if (groups.length > 0 && req.body.newname !== req.body.oldname)
          res.status(409).send('New group name already exists');
        else {
          Group.update(
            { name: req.body.oldname },
            {
              $set: {
                name: req.body.newname,
                description: req.body.description
              }
            },
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
