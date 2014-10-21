exports.HasError = function(arg) {
    if (arg instanceof String && arg.indexOf('ERROR-') == 0)
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

/* File system errors */
exports.FSNotExist = 'ERROR-FS-NOT-EXIST';
exports.FSIOError = 'ERROR-FS-IO-ERROR';
exports.FSRemoveItem = 'ERROR-FS-REMOVE';
exports.FSBrokenPipe = 'ERROR-FS-BROKEN-PIPE';

/* APP manager errors */
exports.APPBadFileFormat = 'ERROR-APP-FORMAT';
exports.APPBadContentStruct = 'ERROR-APP-CONTENT-STRUCT';
exports.APPBadIdentifier = 'ERROR-APP-IDENTIFIER';
exports.APPUpgradeFail = 'ERROR-APP-UPGRADE';
exports.APPExtractFail = 'ERROR-APP-EXTRACT';
exports.APPInstallFail = 'ERROR-APP-INSTALL';

/* Storage errors */
exports.StorSystemDiskNotFound = 'ERROR-STOR-NO-SYS-DISK';
exports.StorUserDiskNotFound = 'ERROR-STOR-NO-USER-DISK';
