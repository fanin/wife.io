var LauncherDispatcher = require('../dispatcher/LauncherDispatcher');
var LauncherConstants  = require('../constants/LauncherConstants');
var EventEmitter       = require('events').EventEmitter;
var assign             = require('object-assign');

var CHANGE_EVENT = 'LAUNCHER_CHANGE';
var ERROR_EVENT  = 'LAUNCHER_ERROR';
var APPSORT_FILE = 'appsort.json';

var appList = [];

var LauncherStore = assign({}, EventEmitter.prototype, {
    getAppList: function() {
        return appList;
    },

    getAppManifest: function(directory) {
        for (var key in appList)
            if (appList[key].directory === directory)
                return appList[key];
        return null;
    },

    getAppType: function(manifest) {
        return AppManagerClient.getType(manifest);
    },

    /**
     * @param {object} changes object
     */
    emitChange: function(changes) {
        this.emit(CHANGE_EVENT, changes);
    },

    /**
     * @param {object} error object
     */
    emitError: function(error) {
        this.emit(ERROR_EVENT, error);
    },

    /**
     * @param {function} callback
     */
    addChangeListener: function(callback) {
        this.on(CHANGE_EVENT, callback);
    },

    /**
     * @param {function} callback
     */
    addErrorListener: function(callback) {
        this.on(ERROR_EVENT, callback);
    },

    /**
     * @param {function} callback
     */
    removeChangeListener: function(callback) {
        this.removeListener(CHANGE_EVENT, callback);
    },

    /**
     * @param {function} callback
     */
    removeErrorListener: function(callback) {
        this.removeListener(ERROR_EVENT, callback);
    }
});

function mergeSortList(list) {
    FileManagerClient.readFile(APPSORT_FILE, 'utf8', function(path, data, error) {
        if (error) {
            LauncherStore.emitError({
                type: LauncherConstants.LAUNCHER_APP_LIST,
                msg: 'Unable to read APP list (' + error + ')'
            });
        }
        else {
            var _key;
            var _sorted = JSON.parse(data);

            /* Build sorted app list dictionary to speed up merge process */
            var _dictionary = [];
            for (_key in _sorted)
                _dictionary[_sorted[_key].directory] = _sorted[_key];

            /* Merge sorted list & latest app list */
            for (_key in list)
                if (_dictionary[list[_key].directory] === undefined)
                    _sorted.push(list[_key]);

            appList = _sorted;
            LauncherStore.emitChange({ type: LauncherConstants.LAUNCHER_APP_LIST });
        }
    });
}

function writeSortList(list, actionType) {
    var _appsort = JSON.stringify(list, null, 4);
    FileManagerClient.writeFile(APPSORT_FILE, _appsort, function(path, progress, error) {
        if (error) {
            LauncherStore.emitError({
                type: actionType,
                msg: 'Unable to write APP list'
            });
        }
        else {
            appList = list;
            LauncherStore.emitChange({ type: actionType });
        }
    });
}

function removeAppFromSortList(manifest) {
    /* Remove manifest from appList */
    for (var i = 0, len = appList.length; i < len; i++) {
        if (appList[i].directory === manifest.directory) {
            appList.splice(i, 1);
            break;
        }
    }

    /* Update appsort.json */
    var _appsort = JSON.stringify(appList, null, 4);
    FileManagerClient.writeFile(APPSORT_FILE, _appsort, function(path, progress, error) {
        if (error) {
            LauncherStore.emitError({
                type: LauncherConstants.LAUNCHER_APP_UNINSTALL,
                msg: 'Unable to write APP list'
            });
        }
        else {
            LauncherStore.emitChange({ type: LauncherConstants.LAUNCHER_APP_UNINSTALL_SUCCESS });
        }
    });
}

LauncherDispatcher.register(function(action) {
    switch (action.actionType) {
        case LauncherConstants.LAUNCHER_APP_LIST:
            FileManagerClient.exist(APPSORT_FILE, function(path, exist, isDir, error) {
                if (error) throw new Error('File system operation error');

                if (exist)
                    mergeSortList(action.list);
                else
                    writeSortList(action.list, action.actionType);
            });
            break;
        case LauncherConstants.LAUNCHER_APP_UNINSTALL:
            break;
        case LauncherConstants.LAUNCHER_APP_UNINSTALL_SUCCESS:
            removeAppFromSortList(action.manifest);
            break;
        case LauncherConstants.LAUNCHER_APP_UNINSTALL_FAIL:
            LauncherStore.emitError({
                type: LauncherConstants.LAUNCHER_APP_UNINSTALL,
                msg: 'Uninstall APP failed (' + action.error + ')'
            });
            break;
        case LauncherConstants.LAUNCHER_APP_WRITE_SORT_LIST:
            writeSortList(action.list, action.actionType);
            break;
        case LauncherConstants.LAUNCHER_APP_ENTER_MANAGE_MODE:
            LauncherStore.emitChange({ type: action.actionType });
            break;
        case LauncherConstants.LAUNCHER_APP_LEAVE_MANAGE_MODE:
            LauncherStore.emitChange({ type: action.actionType });
            break;
        case LauncherConstants.LAUNCHER_APP_ICON_MOVE:
            LauncherStore.emitChange({
                type: action.actionType,
                manifest: action.manifest,
                start: action.start,
                end: action.end
            });
    }
});

module.exports = LauncherStore;
