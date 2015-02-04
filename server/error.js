var keyMirror = require('keymirror');

var errors = keyMirror({
    HAS_ERROR: null,

    /* General system errors */
    ERROR_INVALID_ARG: null,

    /* WSAPI errors */
    ERROR_WSAPI_READ: null,
    ERROR_WSAPI_PARSE: null,

    /* Extension module errors */
    ERROR_EXTENSION_LOAD: null,
    ERROR_EXTENSION_NOT_ALLOW: null,

    /* Security errors */
    ERROR_SECURITY_ACCESS_DENIED: null,
    ERROR_SECURITY_EXTERNAL_NOT_ALLOWED: null,

    /* File system errors */
    ERROR_FS_NOT_EXIST: null,
    ERROR_FS_IO: null,
    ERROR_FS_REMOVE: null,
    ERROR_FS_BROKEN_PIPE: null,
    ERROR_FS_INVALID_URL: null,

    /* APP manager errors */
    ERROR_APP_BAD_FILE_FORMAT: null,
    ERROR_APP_BAD_STRUCT: null,
    ERROR_APP_BAD_ID: null,
    ERROR_APP_UPGRADE: null,
    ERROR_APP_EXTRACT: null,
    ERROR_APP_INSTALL: null,

    /* Storage errors */
    ERROR_STOR_UNKNOWN: null,
    ERROR_STOR_DISK_API: null,
    ERROR_STOR_SYSDISK_NOT_FOUND: null,
    ERROR_STOR_DISK_NOT_FOUND: null,
    ERROR_STOR_BAD_DISK_INFO: null
});

errors['HAS_ERROR'] = function(arg) {
    try {
        if (arg.indexOf('ERROR-') === 0)
            return true;
        else
            return false;
    }
    catch (err) {
        return false;
    }
};

module.exports = errors;
