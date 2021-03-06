/**
 * The **File System Web API** provides file system accessibility for apps to manipulate files.
 *
 * @apiClass File System API
 * @apiVersion 1.00
 * @apiBasePath /api/v1
 */

var express    = require('express'),
    path       = require('path'),
    url        = require('url'),
    http       = require('http'),
    rwlock     = require('rwlock'),
    uploader   = require('routes/helper/upload'),
    pathParser = require('routes/helper/path-parser'),
    fsmgr      = require('lib/fs/fs-manager');

var router = express.Router();
var lock = new rwlock();

function getUploader() {
  return uploader(Infinity, null, null,
    function(file, req, res) {
      var _uploadid = file.name.split('.').shift(),
          _opt_append = req.query.append == 1,
          _opt_encoding = req.query.encoding,
          _absolute_path = req.params.path;

      lock.writeLock(_absolute_path, function(release) {
        if (_opt_append) {
          fsmgr.readFile(file.path, { encoding: _opt_encoding }, function(error, data) {
            if (error) {
              res.status(500).send(error.code);
              release();
            }
            else {
              fsmgr.appendFile(_absolute_path, data, { encoding: _opt_encoding }, function(error) {
                if (error)
                  res.status(500).send(error.code);
                else
                  res.status(200).send(_uploadid);
                release();
              });
            }
          });
        }
        else {
          fsmgr.move(file.path, _absolute_path, function(error) {
            if (error)
              res.status(500).send(error.code);
            else
              res.status(200).send(_uploadid);
            release();
          });
        }
      });
    }
  );
}

function readFile(req, res, next) {
  var _opt_encoding = req.query.encoding,
      _opt_download = req.query.download == 1,
      _absolute_path = req.params.path;

  fsmgr.exists(_absolute_path, function(exists) {
    if (exists) {
      lock.readLock(_absolute_path, function(release) {
        if (_opt_download)
          res.cookie('fileDownload', 'true')
             .cookie('path', '/')
             .download(_absolute_path, path.basename(_absolute_path), function(error) {
            release();
            if (error && !res.headersSent)
              res.status(500).send(error.code);
          });
        else
          fsmgr.readFile(_absolute_path, { encoding: _opt_encoding }, function(error, data) {
            release();
            if (error)
              res.status(500).send(error.code);
            else
              res.send(new Buffer(data, _opt_encoding));
          });
      });
    }
    else
      res.sendStatus(404);
  });
}

function removeFile(req, res, next) {
  fsmgr.exists(req.params.path, function(exists) {
    if (exists) {
      lock.writeLock(req.params.path, function(release) {
        fsmgr.removeFile(req.params.path, function(error) {
          if (error)
            res.status(500).send(error.code);
          else
            res.sendStatus(200);
          release();
        });
      });
    }
    else
      res.sendStatus(404);
  });
}

function ls(req, res, next) {
  var _opt_get_stat = req.query.get_stat == 1,
      _absolute_path = req.params.path;

  fsmgr.exists(_absolute_path, function(exists) {
    if (exists) {
      fsmgr.list(_absolute_path, { stat: _opt_get_stat }, function(error, files, stats) {
        if (error)
          res.status(500).send(error.code);
        else
          res.json({ files: files, stats: stats });
      });
    }
    else
      res.sendStatus(404);
  });
}

function mkdir(req, res, next) {
  fsmgr.mkdir(req.params.path, function(error) {
    if (error)
      res.status(500).send(error.code);
    else
      res.sendStatus(200);
  });
}

function ln(req, res, next) {
  var _opt_symlink = req.query.symbolic == 1,
      _abs_src_path = req.params.source,
      _abs_tgt_path = req.params.target;

  fsmgr.exists(_abs_src_path, function(exists) {
    if (exists) {
      fsmgr.link(_abs_src_path, _abs_tgt_path, { symbolic: _opt_symlink }, function(error) {
        if (error)
          res.status(500).send(error.code);
        else
          res.sendStatus(200);
      });
    }
    else
      res.sendStatus(404);
  });
}

function mv(req, res, next) {
  var _abs_src_path = req.params.source,
      _abs_tgt_path = req.params.target;

  fsmgr.exists(_abs_src_path, function(exists) {
    if (exists) {
      fsmgr.move(_abs_src_path, _abs_tgt_path, function(error) {
        if (error)
          res.status(500).send(error.code);
        else
          res.sendStatus(200);
      });
    }
    else
      res.sendStatus(404);
  });
}

function cp(req, res, next) {
  var _abs_src_path = req.params.source,
      _abs_tgt_path = req.params.target;

  fsmgr.exists(_abs_src_path, function(exists) {
    if (exists) {
      fsmgr.copy(_abs_src_path, _abs_tgt_path, function(error) {
        if (error)
          res.status(500).send(error.code);
        else
          res.sendStatus(200);
      });
    }
    else
      res.sendStatus(404);
  });
}

function exist(req, res, next) {
  fsmgr.exists(req.params.path, function(exists) {
    if (exists)
      res.sendStatus(200);
    else
      res.sendStatus(404);
  });
}

function lstat(req, res, next) {
  fsmgr.exists(req.params.path, function(exists) {
    if (exists) {
      fsmgr.lstat(req.params.path, function(error, stats) {
        if (error)
          res.status(500).send(error.code);
        else
          res.json(stats);
      });
    }
    else
      res.sendStatus(404);
  });
}

function touch(req, res, next) {
  var _now = new Date();

  fsmgr.exists(req.params.path, function(exists) {
    if (exists) {
      fsmgr.touch(req.params.path, _now, _now, function(error) {
        if (error)
          res.status(500).send(error.code);
        else
          res.sendStatus(200);
      });
    }
    else
      res.sendStatus(404);
  });
}

function wget(req, res, next) {
  var _param_url = req.params.url,
      _absolute_path = req.params.path;

  fsmgr.wget(_absolute_path, _param_url, function(error) {
    if (error)
      res.status(500).send(error);
    else
      res.sendStatus(200);
  });
}

function grep(req, res, next) {
  var _opt_encoding       = req.query.encoding,
      _opt_regex_modifier = req.query.regex_modifier,
      _opt_match_only     = req.query.match_only == 1,
      _opt_test_only      = req.query.test_only == 1,
      _opt_parse_format   = req.query.parse_format == 1,
      _param_pattern      = req.params.pattern,
      _absolute_path      = req.params.path;

  fsmgr.grep(_absolute_path, _param_pattern, {
    encoding:       _opt_encoding,
    regexModifiers: _opt_regex_modifier,
    matchOnly:      _opt_match_only,
    testOnly:       _opt_test_only,
    parseFormat:    _opt_parse_format
  }, function(error, data) {
    if (error) {
      if (error === 'File not found')
        res.sendStatus(404);
      else
        res.status(500).send(error);
    }
    else {
      if (_opt_test_only) {
        if (data)
          res.status(200).send('Search Pattern Match');
        else
          res.status(204).send('Search Pattern Mismatch');
      }
      else {
        if (data)
          res.send(new Buffer(data, _opt_encoding));
        else
          res.status(204).send('Search Pattern Mismatch');
      }
    }
  });
}

/**
 * Write `Blob` data into a file.
 *
 * @apiMethod WriteFile {POST} /fs/file/`:path`_[?options]_
 * @apiParam   {String}  path     URL encoded path.
 * @apiReqBody {Object}  formdata `FormData` object containing `Blob` data.
 * @apiOption  {Boolean} append   If file already exists, set to `1` to append data to the file, set to `0` to replace it.
 * @apiOption  {String}  encoding Used only with `append=1` option. Indicates the encoding of the source file and the `Blob` data. *Default: 'utf8'.*
 *
 * Supported encodings:
 * - 'ascii' - 7 bit ASCII data, will strip the high bit if set.
 * - 'utf8' - Multibyte encoded Unicode characters.
 * - 'base64' - Base64 string encoding.
 * - 'hex' - Encode each byte as two hexadecimal characters.
 *
 * @apiReturn 200 File written successfully.
 * @apiReturn 400 Bad path parameter.
 * @apiReturn 400 Bad path URL format.
 * @apiReturn 403 (Read only file system) Writing to read only file system.
 * @apiReturn 403 (Direct access to system disk is forbidden)
 * @apiReturn 403 (Direct access to internal data disk is forbidden)
 * @apiReturn 404 (App not found) Reading read only file system requires app information to resolve path.
 * @apiReturn 500 {String} error Error code that indicates the state of write failure.
 *
 * @apiExample
 *    apiutil.upload('/api/v1/fs/file/' + encodeURIComponent('hello/world/readme.txt'),
 *                   new Blob(['this is first line'], { type : 'text/plain' }));
 */
router.post('/file/:path', pathParser, getUploader());

/**
 * Read data from a file.
 *
 * @apiMethod ReadFile {GET} /fs/file/`:path`_[?options]_
 * @apiParam  {String} path     URL encoded path.
 * @apiOption {String} encoding Data encoding of the `Blob`. See [WriteFile API](#WriteFile) for supported encoding. *Default: 'utf8'.*
 *
 * @apiReturn 200 {Buffer} data Data read from the file.
 * @apiReturn 400 Bad path parameter.
 * @apiReturn 400 Bad path URL format.
 * @apiReturn 403 (Direct access to system disk is forbidden)
 * @apiReturn 403 (Direct access to internal data disk is forbidden)
 * @apiReturn 404 (App not found) Reading read only file system requires app information to resolve path.
 * @apiReturn 404 File not found.
 * @apiReturn 500 {String} error Error code that indicates the state of read failure.
 */
router.get('/file/:path', pathParser, readFile);

/**
 * Remove a file.
 *
 * @apiMethod RemoveFile {DELETE} /fs/file/`:path`_[?options]_
 * @apiParam {String} path URL encoded path.
 *
 * @apiReturn 200 File removed successfully.
 * @apiReturn 400 Bad path parameter.
 * @apiReturn 400 Bad path URL format.
 * @apiReturn 403 (Read only file system) Writing to read only file system.
 * @apiReturn 403 (Direct access to system disk is forbidden)
 * @apiReturn 403 (Direct access to internal data disk is forbidden)
 * @apiReturn 404 (App not found) Reading read only file system requires app information to resolve path.
 * @apiReturn 404 File not found.
 * @apiReturn 500 {String} error Error code that indicates the state of remove failure.
 */
router.delete('/file/:path', pathParser, removeFile);

/**
 * List directory contents.
 *
 * @apiMethod List {GET} /fs/ls/`:path`_[?options]_
 * @apiParam  {String}  path     URL encoded path.
 * @apiOption {Boolean} get_stat Set to `1` to get file status while listing the directory and return a list object with the status array.
 *
 * @apiReturn 200 {Object} list Returns a list object `{ files: [], stats: [] }`.
 *                              Where `files` is an array of the names of the files in the directory, and `stats` is an array of the `fs.Stats` object for each file.
 * @apiReturn 400 Bad path parameter.
 * @apiReturn 400 Bad path URL format.
 * @apiReturn 403 (Direct access to system disk is forbidden)
 * @apiReturn 403 (Direct access to internal data disk is forbidden)
 * @apiReturn 404 (App not found) Reading read only file system requires app information to resolve path.
 * @apiReturn 404 File or directory not found.
 * @apiReturn 500 {String} error Error code that indicates the state of list failure.
 */
router.get('/ls/:path', pathParser, ls);

/**
 * Create directory and intermediate directories as required. Same behavior as `'mkdir -p'` command.
 *
 * @apiMethod CreateDirectory {POST} /fs/mkdir/`:path`_[?options]_
 * @apiParam {String} path URL encoded path.
 *
 * @apiReturn 200 Directory created successfully.
 * @apiReturn 400 Bad path parameter.
 * @apiReturn 400 Bad path URL format.
 * @apiReturn 403 (Read only file system) Writing to read only file system.
 * @apiReturn 403 (Direct access to system disk is forbidden)
 * @apiReturn 403 (Direct access to internal data disk is forbidden)
 * @apiReturn 404 (App not found) Reading read only file system requires app information to resolve path.
 * @apiReturn 500 {String} error Error code that indicates the state of create directory failure.
 */
router.post('/mkdir/:path', pathParser, mkdir);

/**
 * Create a linked file which has the same modes as the original file. Same as `'ln'` command.
 *
 * @apiMethod CreateLink {POST} /fs/ln/`:source`/`:target`_[?options]_
 * @apiParam  {String}  source   URL encoding source path.
 * @apiParam  {String}  target   URL encoding target path.
 * @apiOption {Boolean} symbolic Set to `1` to create a symbolic link.
 *
 * @apiReturn 200 Link created successfully.
 * @apiReturn 400 Bad path parameter.
 * @apiReturn 400 Bad path URL format.
 * @apiReturn 403 (Read only file system) Writing to read only file system.
 * @apiReturn 403 (Direct access to system disk is forbidden)
 * @apiReturn 403 (Direct access to internal data disk is forbidden)
 * @apiReturn 404 (App not found) Reading read only file system requires app information to resolve path.
 * @apiReturn 404 Source file not found.
 * @apiReturn 500 {String} error Error code that indicates the state of create link failure.
 */
router.post('/ln/:source/:target', pathParser, ln);

/**
 * Move file. Allows cross disk file movement. Same as `'mv'` command.
 *
 * @apiMethod Move {POST} /fs/mv/`:source`/`:target`_[?options]_
 * @apiParam {String} source URL encoding source path.
 * @apiParam {String} target URL encoding target path.
 *
 * @apiReturn 200 File moved successfully.
 * @apiReturn 400 Bad path parameter.
 * @apiReturn 400 Bad path URL format.
 * @apiReturn 403 (Read only file system) Writing to read only file system.
 * @apiReturn 403 (Direct access to system disk is forbidden)
 * @apiReturn 403 (Direct access to internal data disk is forbidden)
 * @apiReturn 404 (App not found) Reading read only file system requires app information to resolve path.
 * @apiReturn 404 Source file not found.
 * @apiReturn 500 {String} error Error code that indicates the state of move failure.
 */
router.post('/mv/:source/:target', pathParser, mv);

/**
 * Copy file. Allows cross disk file copy. Same as `'cp'` command.
 *
 * @apiMethod Copy {POST} /fs/cp/`:source`/`:target`_[?options]_
 * @apiParam {String} source URL encoding source path.
 * @apiParam {String} target URL encoding target path.
 *
 * @apiReturn 200 File copied successfully.
 * @apiReturn 400 Bad path parameter.
 * @apiReturn 400 Bad path URL format.
 * @apiReturn 403 (Read only file system) Writing to read only file system.
 * @apiReturn 403 (Direct access to system disk is forbidden)
 * @apiReturn 403 (Direct access to internal data disk is forbidden)
 * @apiReturn 404 (App not found) Reading read only file system requires app information to resolve path.
 * @apiReturn 404 Source file not found.
 * @apiReturn 500 {String} error Error code that indicates the state of copy failure.
 */
router.post('/cp/:source/:target', pathParser, cp);

/**
 * Check if file or directory exists.
 *
 * @apiMethod Exist {GET} /fs/exist/`:path`_[?options]_
 * @apiParam {String} path URL encoded path.
 *
 * @apiReturn 200 File exists.
 * @apiReturn 400 Bad path parameter.
 * @apiReturn 400 Bad path URL format.
 * @apiReturn 403 (Direct access to system disk is forbidden)
 * @apiReturn 403 (Direct access to internal data disk is forbidden)
 * @apiReturn 404 (App not found) Reading read only file system requires app information to resolve path.
 * @apiReturn 404 File does not exist.
 */
router.get('/exist/:path', pathParser, exist);

/**
 * Get file status.
 *
 * @apiMethod GetStat {GET} /fs/stat/`:path`_[?options]_
 * @apiParam {String} path URL encoded path.
 *
 * @apiReturn 200 {Object} stat File status object. See Node.js [fs.Stats Class](https://nodejs.org/api/fs.html#fs_class_fs_stats) for details.
 * @apiReturn 400 Bad path parameter.
 * @apiReturn 400 Bad path URL format.
 * @apiReturn 403 (Direct access to system disk is forbidden)
 * @apiReturn 403 (Direct access to internal data disk is forbidden)
 * @apiReturn 404 (App not found) Reading read only file system requires app information to resolve path.
 * @apiReturn 404 File not found.
 * @apiReturn 500 {String} error Unable to get file status with error code returned.
 */
router.get('/stat/:path', pathParser, lstat);

/**
 * Change file access and modification times by current date & time.
 *
 * @apiMethod Touch {PUT} /fs/touch/`:path`_[?options]_
 * @apiParam {String} path URL encoded path.
 *
 * @apiReturn 200 File touched successfully.
 * @apiReturn 400 Bad path parameter.
 * @apiReturn 400 Bad path URL format.
 * @apiReturn 403 (Read only file system) Writing to read only file system.
 * @apiReturn 403 (Direct access to system disk is forbidden)
 * @apiReturn 403 (Direct access to internal data disk is forbidden)
 * @apiReturn 404 (App not found) Reading read only file system requires app information to resolve path.
 * @apiReturn 404 File not found.
 * @apiReturn 500 {String} error Error code that indicates the state of touch failure.
 */
router.put('/touch/:path', pathParser, touch);

/**
 * Download a file from web URL. Supports `http` and `https` protocols. Similar to the `'wget'` command.
 *
 * @apiMethod WebGet {GET} /fs/wget/`:path`/`:url`_[?options]_
 * @apiParam {String} path URL encoded path to save the source file.
 * @apiParam {String} url  URL encoded source file URL.
 *
 * @apiReturn 200 File downloaded to `:path` successfully.
 * @apiReturn 400 Bad path parameter.
 * @apiReturn 400 Bad path URL format.
 * @apiReturn 403 (Read only file system) Writing to read only file system.
 * @apiReturn 403 (Direct access to system disk is forbidden)
 * @apiReturn 403 (Direct access to internal data disk is forbidden)
 * @apiReturn 404 (App not found) Reading read only file system requires app information to resolve path.
 * @apiReturn 500 {String} error Error message that describes the download failure.
 */
router.post('/wget/:path/:url', pathParser, wget);

/**
 * Search given input file, selecting lines that match the given pattern. Similar to the `'grep'` command.
 *
 * @apiMethod Grep {GET} /fs/grep/`:path`/`:pattern`_[?options]_
 * @apiParam  {String}  path           URL encoded path.
 * @apiParam  {String}  pattern        Regular expression pattern. See [JavaScript RegExp Reference](http://www.w3schools.com/jsref/jsref_obj_regexp.asp) for details.
 * @apiOption {String}  encoding       Data encoding of the file to be searched. *Default: 'utf8'.*
 * @apiOption {String}  regex_modifier Modifiers are used to perform case-insensitive and global searches. See [JavaScript RegExp Reference](http://www.w3schools.com/jsref/jsref_obj_regexp.asp) for details.
 * @apiOption {Boolean} match_only     Return only the matching part of the lines.
 * @apiOption {Boolean} test_only      Return only the status `200 (Match)` or `204 (Mismatch)` without data.
 * @apiOption {Boolean} parse_format   Support rich text format parsing while searching the pattern. Currently supports 'HTML' only.
 *
 * @apiReturn 200 {Buffer} data Data that matches the search pattern returned if `match_only` is set, return the entire data content.
 * @apiReturn 200 (Search Pattern Match)    Indicates a match is found when `test_only` option is set.
 * @apiReturn 204 (Search Pattern Mismatch) Indicates no match is found when `test_only` option is set.
 * @apiReturn 400 Bad path parameter.
 * @apiReturn 400 Bad path URL format.
 * @apiReturn 403 (Direct access to system disk is forbidden)
 * @apiReturn 403 (Direct access to internal data disk is forbidden)
 * @apiReturn 404 (App not found) Reading read only file system requires app information to resolve path.
 * @apiReturn 404 File not found.
 * @apiReturn 500 {String} error Error message that describes the search failure.
 */
router.get('/grep/:path/:pattern', pathParser, grep);

module.exports = router;
