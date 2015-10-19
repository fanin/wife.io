var fse    = require('fs-extra'),
    path   = require('path'),
    multer = require('multer'),
    config = require('config'),
    strmsc = require('utils/common/string-misc');

module.exports = function(sizeLimit, mimeType, onUploadStart, onUploadComplete, onUploadError) {
  return [ multer({
    dest: path.join(config.settings.temp_data_path, 'uploads', 'apps'),
    limits: {
      fileSize: sizeLimit
    },
    rename: function(fieldname, filename) {
      return strmsc.uniqueString();
    },
    changeDest: function(dest, req, res) {
      var appTempPath = path.join(dest, req.cookies.appid);
      fse.mkdirpSync(appTempPath);
      return appTempPath;
    },
    onError: function(error, next) {
      next(error);
    },
    onFileSizeLimit: function(file) {
      console.log('File size limit exceeded: ', file.originalname);
    },
    onFileUploadStart: function(file, req, res) {
      onUploadStart && onUploadStart(file, req, res);

      if (mimeType && file.mimetype !== mimeType) {
        onUploadError && onUploadError({ code: 415, message: 'Bad MIME Type' }, file);
        return false;
      }
    },
    onFileUploadData: function(file, data, req, res) {
      //console.log(file.size);
    },
    onFileUploadComplete: function(file, req, res) {
      //console.log(file.originalname + ' uploaded to ' + file.path);
      onUploadComplete && onUploadComplete(file, req, res);
    }
  }), function(req, res, next) {}];
}
