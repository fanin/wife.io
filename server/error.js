exports.HasError = function(arg) {
    if (arg instanceof String && arg.indexOf('ERROR-') === 0)
        return true;
    else
        return false;
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
exports.StorSystemDiskNotFound = 'ERROR-STOR-NO-SYS-DISK';
exports.StorUserDiskNotFound = 'ERROR-STOR-NO-USER-DISK';
exports.StorBadDiskInfo = 'ERROR-STOR-DISK-INFO';
