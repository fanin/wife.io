exports.HasError = function(arg) {
    try {
        if (arg.indexOf('ERROR-') === 0)
            return true;
        else
            return false;
    }
    catch (err) {
        return false;
    }
}

/* Protocol errors */
exports.ProtoRead = 'ERROR-PROTO-READ';
exports.ProtoParse = 'ERROR-PROTO-PARSE';

/* Extension module errors */
exports.ExtensionLoad = 'ERROR-EXTENSION-LOAD';
exports.ExtensionNotAllow = 'ERROR-EXTENSION-NOT-ALLOW';

/* Security errors */
exports.SecurityAccessDenied = 'ERROR-SECURITY-ACCESS-DENIED';
exports.SecurityExternalNotAllowed = 'ERROR-SECURITY-EXT-NOT-ALLOW';

/* File system errors */
exports.FSNotExist = 'ERROR-FS-NOT-EXIST';
exports.FSIOError = 'ERROR-FS-IO-ERROR';
exports.FSRemoveItem = 'ERROR-FS-REMOVE';
exports.FSBrokenPipe = 'ERROR-FS-BROKEN-PIPE';
exports.FSInvalidURL = 'ERROR-FS-INVALID-URL';

/* APP manager errors */
exports.APPBadFileFormat = 'ERROR-APP-FORMAT';
exports.APPBadContentStruct = 'ERROR-APP-CONTENT-STRUCT';
exports.APPBadIdentifier = 'ERROR-APP-IDENTIFIER';
exports.APPUpgradeFail = 'ERROR-APP-UPGRADE';
exports.APPExtractFail = 'ERROR-APP-EXTRACT';
exports.APPInstallFail = 'ERROR-APP-INSTALL';

/* Storage errors */
exports.StorUnknownError = 'ERROR-STOR-UNKNOWN';
exports.StorDiskApiError = 'ERROR-STOR-DISK-API';
exports.StorSysDiskNotFound = 'ERROR-STOR-SYSDISK-NOTFOUND';
exports.StorDiskNotFound = 'ERROR-STOR-DISK-NOTFOUND';
exports.StorBadDiskInfo = 'ERROR-STOR-DISK-INFO';
