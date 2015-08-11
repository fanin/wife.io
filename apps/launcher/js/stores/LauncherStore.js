var emitter            = require('events').EventEmitter;
var assign             = require('object-assign');
var FSAPI              = require('diligent/FileSystem/FSAPI');
var LauncherDispatcher = require('../dispatcher/LauncherDispatcher');
var LauncherConstants  = require('../constants/LauncherConstants');

var CHANGE_EVENT = 'LAUNCHER_CHANGE';
var ERROR_EVENT  = 'LAUNCHER_ERROR';
var APPSORT_FILE = 'appsort.json';

var appSortList = null;

var LauncherStore = assign({}, emitter.prototype, {
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
    },

    getAppSortList: function() {
        return appSortList;
    }
});

function mergeSortList(list) {
    FSAPI.readFile(APPSORT_FILE, { encoding: 'utf8' }, {
        onSuccess: function(data) {
            var i;
            var _sorted = JSON.parse(data);

            /* Build sorted app list dictionary to speed up merge process */
            var _sortedDict = [];
            for (i in _sorted)
                _sortedDict[_sorted[i].identifier] = _sorted[i];

            var _newDict = [];
            for (i in list)
                _newDict[list[i].identifier] = list[i];

            /* Merge sorted list & latest app list */
            for (i in _sorted)
                if (_newDict[_sorted[i].identifier] === undefined)
                    _sorted.splice(i, 1);

            for (i in list)
                if (_sortedDict[list[i].identifier] === undefined)
                    _sorted.push(list[i]);

            appSortList = _sorted;
            LauncherStore.emitChange({ type: LauncherConstants.LAUNCHER_SORT_APP_LIST });

        },
        onError: function(error) {
            LauncherStore.emitError({
                type: LauncherConstants.LAUNCHER_SORT_APP_LIST,
                msg: 'Unable to read APP list (' + error + ')'
            });
        }
    });
}

function writeSortList(list, actionType) {
    var _appsort = JSON.stringify(list, null, 4);

    FSAPI.writeFile(APPSORT_FILE, _appsort, {
        onSuccess: function() {
            appSortList = list;
            LauncherStore.emitChange({ type: actionType });
        },
        onError: function(error) {
            LauncherStore.emitError({
                type: actionType,
                msg: 'Unable to write APP list'
            });
        }
    });
}

function removeAppFromSortList(manifest) {
    /* Remove manifest from appSortList */
    for (var i = 0, len = appSortList.length; i < len; i++) {
        if (appSortList[i].identifier === manifest.identifier) {
            appSortList.splice(i, 1);
            break;
        }
    }

    /* Update appsort.json */
    var _appsort = JSON.stringify(appSortList, null, 4);
    FSAPI.writeFile(APPSORT_FILE, _appsort, {
        onSuccess: function() {
            LauncherStore.emitChange({ type: LauncherConstants.LAUNCHER_REMOVE_APP_FROM_SORT_LIST });
        },
        onError: function(error) {
            LauncherStore.emitError({
                type: LauncherConstants.LAUNCHER_REMOVE_APP_FROM_SORT_LIST,
                msg: 'Unable to write APP list'
            });
        }
    });
}

LauncherDispatcher.register(function(action) {
    switch (action.actionType) {
        case LauncherConstants.LAUNCHER_SORT_APP_LIST:
            FSAPI.exist(APPSORT_FILE, {
                onSuccess: function(exist) {
                    if (exist)
                        mergeSortList(action.list);
                    else
                        writeSortList(action.list, action.actionType);
                }
            });
            break;
        case LauncherConstants.LAUNCHER_REMOVE_APP_FROM_SORT_LIST:
            removeAppFromSortList(action.manifest);
            break;
        case LauncherConstants.LAUNCHER_WRITE_SORT_APP_LIST:
            writeSortList(action.list, action.actionType);
            break;
        case LauncherConstants.LAUNCHER_ENTER_MANAGE_MODE:
            LauncherStore.emitChange({ type: action.actionType });
            break;
        case LauncherConstants.LAUNCHER_LEAVE_MANAGE_MODE:
            LauncherStore.emitChange({ type: action.actionType });
            break;
        case LauncherConstants.LAUNCHER_MOVE_APP_ICON:
            LauncherStore.emitChange({
                type: action.actionType,
                manifest: action.manifest,
                start: action.start,
                end: action.end
            });
    }
});

module.exports = LauncherStore;
