/*
 * Derived from nodejs-disks to fix not all disks are listed in OSX
 */

var exec    = require('child_process').exec,
    os      = require('os'),
    async   = require('async'),
    numeral = require('numeral');

/**
 * Retrieve disks list.
 *
 * @param callback
 */
exports.drives = function (callback) {
    switch (os.platform().toLowerCase()) {
        case 'win32':
            getDrivesWin32('wmic logicaldisk get caption', callback);
            break;
        case 'darwin':
            getDrives('df -k | awk \'{print $1}\'', callback);
            break;
        case 'linux':
        default:
            getDrives('df | awk \'{print $1}\'', callback);
    }
};

/**
 * Execute a command to retrieve disks list.
 *
 * @param command
 * @param callback
 */
function getDrives(command, callback) {
    var child = exec(
        command,
        function (err, stdout, stderr) {
            if (err) return callback(err);
            var drives = stdout.split('\n');

            drives.splice(0, 1);
            drives.splice(-1, 1);

            // Removes ram drives
            drives = drives.filter(function(item){ return item != "none"});
            // Removes map drives
            drives = drives.filter(function(item){ return item != "map"});
            callback(null, drives);
        }
    );
}

function getDrivesWin32(command, callback) {
    var child = exec(
        command,
        function (err, stdout, stderr) {
            if (err) return callback(err);
            var drives = stdout.split('\r\r\n');

            drives.splice(0, 1);
            drives.splice(-2, 2);

            for (var i in drives)
                drives[i] = drives[i].trim();

            // Removes drives without disk
            function removeDrives(i) {
                getDetailWin32('wmic logicaldisk where "DeviceID=\'' + drives[i] + '\'" get Size', function(e, s) {
                    if (e || s === 0) drives.splice(i, 1);
                    if (--i >= 0)
                        removeDrives(i);
                    else
                        callback(null, drives);
                });
            }

            removeDrives(drives.length - 1);
        }
    );
}

/**
 * Retrieve space information about one drive.
 *
 * @param drive
 * @param callback
 */
exports.driveDetail = function (drive, callback) {
    detail(drive, callback);
};

/**
 * Retrieve space information about each drives.
 *
 * @param drives
 * @param callback
 */
exports.drivesDetail = function (drives, callback) {
    var drivesDetail = [];

    async.eachSeries(
        drives,
        function (drive, cb) {
            detail(
                drive,
                function (err, detail) {
                    if (err) return cb(err);
                    drivesDetail.push(detail);
                    cb();
                }
            );
        },
        function (err) {
            if (err) return callback(err);
            callback(null, drivesDetail);
        }
    );
};

/**
 * Retrieve space information about one drive.
 *
 * @param drive
 * @param callback
 */
function detail(drive, callback) {
    async.series(
        {
            used: function (callback) {
                switch (os.platform().toLowerCase()) {
                    case 'win32':
                        getDetailWin32('wmic logicaldisk where "DeviceID=\'' + drive + '\'" get Size', function(e, s) {
                            if (e) callback(e, 0);
                            else if (s === 0) callback(null, 0);
                            else
                                getDetailWin32('wmic logicaldisk where "DeviceID=\'' + drive + '\'" get FreeSpace', function(e, a) {
                                    if (e) callback(e, 0);
                                    else callback(null, s - a);
                                });
                        });
                        break;
                    case 'darwin':
                        getDetail('df -k | grep ' + drive + ' | awk \'{print $3}\'', callback);
                        break;
                    case 'linux':
                    default:
                        getDetail('df | grep ' + drive + ' | awk \'{print $3}\'', callback);
                }
            },
            available: function (callback) {
                switch (os.platform().toLowerCase()) {
                    case 'win32':
                        getDetailWin32('wmic logicaldisk where "DeviceID=\'' + drive + '\'" get FreeSpace', callback);
                        break;
                    case 'darwin':
                        getDetail('df -k | grep ' + drive + ' | awk \'{print $4}\'', callback);
                        break;
                    case 'linux':
                    default:
                        getDetail('df | grep ' + drive + ' | awk \'{print $4}\'', callback);
                }
            },
            mountpoint: function (callback) {
                switch (os.platform().toLowerCase()) {
                    case 'win32':
                        callback(null, drive);
                        break;
                    case 'darwin':
                        getDetailNaN('df -k | grep ' + drive + ' |  awk -F \'%\' \'{ print $3 }\' | sed \'s/^ *//\'', function(e, d){
                            if (e) console.log(e);
                            if (d) d = d.trim();
                            callback(e, d);
                        });
                        break;
                    case 'linux':
                    default:
                        getDetailNaN('df | grep ' + drive + ' | awk \'{print $6}\'', function(e, d){
                            if (d) d = d.trim();
                            callback(e, d);
                        });
                }
            },
            uuid: function (callback) {
                switch (os.platform().toLowerCase()) {
                    case 'win32':
                        getDetailNaNWin32('wmic logicaldisk where "DeviceID=\'' + drive + '\'" get VolumeSerialNumber', callback);
                        break;
                    case 'darwin':
                        getDetailNaN('diskutil info ' + drive + ' | grep \'Volume UUID\' | tr -d \' \' | awk -F \':\' \'{print $2}\'', function(e, d){
                            if (d) d = d.trim();
                            callback(e, d);
                        });
                        break;
                    case 'linux':
                    default:
                        getDetailNaN('ls -l /dev/disk/by-uuid/ | grep ' + drive.replace('/dev/', '') + ' | awk \'{print $9}\'', function(e, d){
                            if (d) d = d.trim();
                            callback(e, d);
                        });
                }
            },
            name: function (callback) {
                switch (os.platform().toLowerCase()) {
                    case 'win32':
                        getDetailNaNWin32('wmic logicaldisk where "DeviceID=\'' + drive + '\'" get VolumeName', function(e, n){
                            if (!n) {
                                getDetailNaNWin32('wmic logicaldisk where "DeviceID=\'' + drive + '\'" get Description', function(e, d){
                                    if (d) {
                                        if (d.indexOf('Local') === 0)
                                            n = 'Local Disk (' + drive + ')';
                                        else if (d.indexOf('Network') === 0)
                                            n = 'Network Disk (' + drive + ')';
                                        else if (d.indexOf('CD-ROM') === 0)
                                            n = 'CD-ROM Drive';
                                    }
                                    callback(e, n);
                                });
                            }
                            else callback(e, n);

                        });
                        break;
                    case 'darwin':
                        getDetailNaN('diskutil info ' + drive + ' | grep \'Volume Name\' | tr -d \' \' | awk -F \':\' \'{print $2}\'', function(e, d){
                            if (d) d = d.trim();
                            callback(e, d);
                        });
                        break;
                    case 'linux':
                    default:
                        getDetailNaN('ls -l /dev/disk/by-label/ | grep ' + drive.replace('/dev/', '') + ' | awk \'{print $9}\'', function(e, d){
                            if (d) d = d.trim();
                            callback(e, d);
                        });
                }
            }
        },
        function (err, results) {
            if (err) return callback(err);

            try {
                results.freePer = numeral(results.available / (results.used + results.available) * 100).format('0')
                results.usedPer = numeral(results.used / (results.used + results.available) * 100).format('0')
                results.total = numeral(results.used + results.available).format('0.00 b');
                results.used = numeral(results.used).format('0.00 b');
                results.available = numeral(results.available).format('0.00 b');
                results.drive = drive;
            }
            catch (error) {
                console.log("disks.js error: " + error);
                console.log('disk name: ' + results.name);
                console.log('mountpoint: ' + results.mountpoint);
                console.log('free: ' + results.freePer + '%');
                console.log('used: ' + results.usedPer + '%');
                console.log('total: ' + results.total);
            }

            callback(null, results);
        }
    );
}

/**
 * Execute a command.
 *
 * @param command
 * @param callback
 */
function getDetail(command, callback) {
    var child = exec(
        command,
        function (err, stdout, stderr) {
            if (err) return callback(err);
            callback(null, parseInt(stdout) * 1024);
        }
    );
}

function getDetailWin32(command, callback) {
    var child = exec(
        command,
        function (err, stdout, stderr) {
            if (err) return callback(err);
            if (stdout) {
                stdout = stdout.split('\r\r\n');
                stdout = stdout[1].trim();
                if (stdout === '') stdout = 0;
            }
            callback(null, parseInt(stdout));
        }
    );
}

/**
 * Execute a command.
 *
 * @param command
 * @param callback
 */
function getDetailNaN(command, callback) {
    var child = exec(
        command,
        function (err, stdout, stderr) {
            if (err) return callback(err);
            callback(null, stdout.trim());
        }
    );
}

function getDetailNaNWin32(command, callback) {
    var child = exec(
        command,
        function (err, stdout, stderr) {
            if (err) return callback(err);
            if (stdout) {
                stdout = stdout.split('\r\r\n');
                stdout = stdout[1].trim();
            }
            callback(null, stdout);
        }
    );
}
