/**
 * The **Storage Management REST API** allows apps to get local disk and cloud disk _(NOT IMPLEMENTED)_ information, disk list and mount/unmount disks _(NOT IMPLEMENTED)_.
 *
 * @apiClass Storage API
 * @apiVersion 1.00
 * @apiBasePath /api/v1
 */

var express    = require('express'),
    sendevent  = require('sendevent'),
    permission = require('system/security/permission'),
    stormgr    = require('system/storage/storage-manager'),
    ssemgr     = require('system/sse/sse-manager');

var router = express.Router();
var events = sendevent('/sse');

function getDisks(req, res, next) {
    stormgr.getDisks(function(disks, error) {
        if (error)
            res.status(500).send(error);
        else
            res.json(disks);
    });
}

function getDisk(req, res, next) {
    var disk = stormgr.getDiskByUUID(req.params.uuid);

    if (disk)
        res.json(disk);
    else
        res.sendStatus(404);
}

function unmountDisk(req, res, next) {
    response.NOT_IMPLEMENT(res);
}

ssemgr.register('storage', events);
router.use(events);

/**
 * Get disk list. An array of disk objects is returned.
 * Disk object structure is described in the description of [GetDisk](#GetDisk).
 *
 * @apiMethod GetDisks {GET} /storage
 *
 * @apiReturn 200 {Array} list Disk object array.
 * @apiReturn 500 Unable to get disk list.
 */
router.get('/', permission.grant, getDisks);

/**
 * Get disk information. A disk object is returned.
 * Here is an example of disk object structure:
 * ```
 * {
 *   used: '163.94 GB',
 *   available: '68.43 GB',
 *   mountpoint: '/',
 *   uuid: '14131988-9579-3A7E-BE21-991936E49CAA',
 *   name: 'MacintoshHD',
 *   freePer: '29',
 *   usedPer: '71',
 *   total: '232.37 GB',
 *   drive: '/dev/disk1',
 *   type: 'System'
 * }
 * ```
 * where
 * - __freePer__: Percentage of free space.
 * - __usedPer__: Percentage of used space.
 * - __type__: Disk type, which can be:
 *  1. __System__: System disk where the system is installed. (ReadOnly)
 *  2. __Data__: Data disk where user app and user data is installed/stored. (Read/Write)
 *  3. __Removable__: USB disk or SDCard. (Read/Write)
 *
 * @apiMethod GetDisk {GET} /storage/`:uuid`
 * @apiParam {String} uuid Disk UUID string.
 *
 * @apiReturn 200 {Object} disk Disk object.
 * @apiReturn 404 Disk not found.
 */
router.get('/:uuid', permission.grant, getDisk);

/**
 * TBD
 */
router.delete('/:uuid', permission.grant, unmountDisk);

module.exports = router;
