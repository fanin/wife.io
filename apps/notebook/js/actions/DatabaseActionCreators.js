var NotebookDispatcher      = require("../dispatcher/NotebookDispatcher");
var NotebookConstants       = require("../constants/NotebookConstants");
var NotebookActionConstants = require("../constants/NotebookActionConstants");
var getTimecode             = require("utils/string-code").getTimecode;
var dirname                 = require("utils/client-utils").dirname;
var base64ToBlob            = require("utils/buffer-utils").base64ToBlob;
var assign                  = require("object-assign");
var async                   = require('async');

var databaseStorage;
var saveWaitTimer;

var DatabaseActionCreators = {

    /**
     * Get bookshelf path inside app userdata folder
     * @method __getBookshelfPath
     * @param path {String} Relative path string
     * @return {String} Bookshelf path inside app userdata folder
     * @private
     */
    __getBookshelfPath: function(path) {
        path = path || "";
        return NotebookConstants.DATABASE_ROOT_FOLDER + "/" + path;
    },

    /**
     * Get path of note on the bookshelf
     * @method __getNotePath
     * @param noteDescriptor {Object} Note descriptor
     * @return {String} Path of given note
     * @private
     */
    __getNotePath: function(noteDescriptor) {
        return this.__getBookshelfPath(noteDescriptor.notebookNode.id + "/" + noteDescriptor.noteId);
    },

    /**
     * Get path of note asset
     * @method __getNoteAssetPath
     * @param noteDescriptor {Object} Note descriptor
     * @param assetName {String} Note asset file name
     * @return {String} Path of note asset
     * @private
     */
    __getNoteAssetPath: function(noteDescriptor, assetName) {
        return this.__getNotePath(noteDescriptor) + "/assets/" + assetName;
    },

    /**
     * Open notebook database on given storage
     * @method openDatabase
     * @param storage {Object} Storage object where database is stored
     */
    openDatabase: function(storage) {
        databaseStorage = storage;
    },

    /**
     * Close notebook database
     * @method closeDatabase
     */
    closeDatabase: function() {
        databaseStorage = null;
    },

    /**
     * Load notebook tree from database
     * @method loadTree
     */
    loadTree: function() {
        if (!databaseStorage) return;

        var treeData = [{
            label: NotebookConstants.DATABASE_NOTEBOOK_ALL_LABEL,
            id: NotebookConstants.DATABASE_NOTEBOOK_ALL_ID
        }];

        NotebookDispatcher.dispatch({
            actionType: NotebookActionConstants.NOTEBOOK_DATABASE_LOADTREE
        });

        /* Create /bookshelf if necessary */
        FileAgent.exist(this.__getBookshelfPath(), function(path, exist, isDir, error) {
            if (error) {
                return NotebookDispatcher.dispatch({
                    actionType: NotebookActionConstants.NOTEBOOK_DATABASE_LOADTREE_ERROR,
                    error: "fs error: " + error
                });
            }

            if (!exist) {
                FileAgent.createDirectory(this.__getBookshelfPath(), function(path, error) {
                    if (error) {
                        NotebookDispatcher.dispatch({
                            actionType: NotebookActionConstants.NOTEBOOK_DATABASE_LOADTREE_ERROR,
                            error: "unable to create " + path + ", error: " + error
                        });
                    }
                });
            }
            else if (exist && !isDir) {
                FileAgent.remove(this.__getBookshelfPath(), function(path, error) {
                    if (error) {
                        NotebookDispatcher.dispatch({
                            actionType: NotebookActionConstants.NOTEBOOK_DATABASE_LOADTREE_ERROR,
                            error: "unable to remove " + path + ", error: " + error
                        });
                    }

                    FileAgent.createDirectory(this.__getBookshelfPath(), function(path, error) {
                        if (error) {
                            NotebookDispatcher.dispatch({
                                actionType: NotebookActionConstants.NOTEBOOK_DATABASE_LOADTREE_ERROR,
                                error: "unable to create " + path + ", error: " + error
                            });
                        }
                    });
                }.bind(this));
            }
        }.bind(this));

        /* Load notebook tree data from bookshelf-tree.json */
        FileAgent.exist(NotebookConstants.DATABASE_TREE_FILE, function(path, exist, isDir, error) {
            if (error) {
                return NotebookDispatcher.dispatch({
                    actionType: NotebookActionConstants.NOTEBOOK_DATABASE_LOADTREE_ERROR,
                    error: "fs error: " + error
                });
            }

            if (exist) {
                FileAgent.readFile(NotebookConstants.DATABASE_TREE_FILE, "utf8", function(path, data, error) {
                    if (error) {
                        NotebookDispatcher.dispatch({
                            actionType: NotebookActionConstants.NOTEBOOK_DATABASE_LOADTREE_ERROR,
                            error: "unable to read tree data: " + error
                        });
                    }
                    else {
                        try {
                            treeData = JSON.parse(data);
                        }
                        catch (error) {
                            NotebookDispatcher.dispatch({
                                actionType: NotebookActionConstants.NOTEBOOK_DATABASE_LOADTREE_ERROR,
                                error: "parse tree data error: " + error + "\ndata:\n" + data
                            });
                        }
                        finally {
                            NotebookDispatcher.dispatch({
                                actionType: NotebookActionConstants.NOTEBOOK_DATABASE_LOADTREE_SUCCESS,
                                treeData: treeData
                            });
                        }
                    }
                });
            }
            else {
                FileAgent.writeFile(NotebookConstants.DATABASE_TREE_FILE, JSON.stringify(treeData), function(path, progress, error) {
                    if (error) {
                        NotebookDispatcher.dispatch({
                            actionType: NotebookActionConstants.NOTEBOOK_DATABASE_LOADTREE_ERROR,
                            error: "unable to write tree data: " + error
                        });
                    }
                    else {
                        NotebookDispatcher.dispatch({
                            actionType: NotebookActionConstants.NOTEBOOK_DATABASE_LOADTREE_SUCCESS,
                            treeData: treeData
                        });
                    }
                });
            }
        });
    },

    /**
     * Save notebook tree to database
     * @method saveTree
     * @param treeJsonData {String} jqTree tree data JSON string
     * @param wait {Number} Wait a period of time in millisecond before saving tree data
     */
    saveTree: function(treeJsonData, wait) {
        var treeData;

        if (!databaseStorage) return;

        wait = wait || 0;

        if (saveWaitTimer) {
            clearTimeout(saveWaitTimer);
        }

        saveWaitTimer = setTimeout(function() {
            saveWaitTimer = undefined;

            NotebookDispatcher.dispatch({
                actionType: NotebookActionConstants.NOTEBOOK_DATABASE_SAVETREE
            });

            try {
                treeData = JSON.parse(treeJsonData);
            }
            catch (error) {
                NotebookDispatcher.dispatch({
                    actionType: NotebookActionConstants.NOTEBOOK_DATABASE_SAVETREE_ERROR,
                    error: "parse tree data error: " + error + "\ndata:\n" + treeJsonData
                });
            }
            finally {
                FileAgent.writeFile(NotebookConstants.DATABASE_TREE_FILE, treeJsonData, function(path, progress, error) {
                    if (error) {
                        NotebookDispatcher.dispatch({
                            actionType: NotebookActionConstants.NOTEBOOK_DATABASE_SAVETREE_ERROR,
                            error: "unable to write tree data: " + error
                        });
                    }
                    else {
                        NotebookDispatcher.dispatch({
                            actionType: NotebookActionConstants.NOTEBOOK_DATABASE_SAVETREE_SUCCESS,
                            treeData: treeData
                        });
                    }
                });
            }
        }, wait);
    },

    /**
     * Create notebook stack in database
     * @method createStack
     * @param name {String} Stack name
     */
    createStack: function(name) {
        if (!databaseStorage) return;

        NotebookDispatcher.dispatch({
            actionType: NotebookActionConstants.NOTEBOOK_DATABASE_CREATE_STACK,
            stackId: parseInt(getTimecode()),
            stackName: name
        });
    },

    /**
     * Create a empty notebook in database
     * @method createNotebook
     * @param name {String} Notebook name
     */
    createNotebook: function(name) {
        if (!databaseStorage) return;

        var code = getTimecode();
        var notebookPath = this.__getBookshelfPath(code);

        NotebookDispatcher.dispatch({
            actionType: NotebookActionConstants.NOTEBOOK_DATABASE_CREATE_NOTEBOOK
        });

        FileAgent.exist(notebookPath, function(path, exist, isDir, error) {
            if (error) {
                return NotebookDispatcher.dispatch({
                    actionType: NotebookActionConstants.NOTEBOOK_DATABASE_CREATE_NOTEBOOK_ERROR,
                    error: "fs operation error: " + error
                });
            }

            if (exist) {
                return NotebookDispatcher.dispatch({
                    actionType: NotebookActionConstants.NOTEBOOK_DATABASE_CREATE_NOTEBOOK_ERROR,
                    error: "given path is already exist"
                });
            }

            FileAgent.createDirectory(notebookPath, function(path, error) {
                if (error) {
                    NotebookDispatcher.dispatch({
                        actionType: NotebookActionConstants.NOTEBOOK_DATABASE_CREATE_NOTEBOOK_ERROR,
                        error: "unable to create " + path + ", error: " + error
                    });
                }
                else {
                    NotebookDispatcher.dispatch({
                        actionType: NotebookActionConstants.NOTEBOOK_DATABASE_CREATE_NOTEBOOK_SUCCESS,
                        notebookId: parseInt(code),
                        notebookName: name
                    });
                }
            });
        });
    },

    /**
     * Remove a notebook from database
     * @method trashNotebook
     * @param notebookNode {Object} jqTree node of notebook to be removed
     */
    trashNotebook: function(notebookNode) {
        if (!databaseStorage) return;

        var notebookPath = this.__getBookshelfPath(notebookNode.id);

        NotebookDispatcher.dispatch({
            actionType: NotebookActionConstants.NOTEBOOK_DATABASE_TRASH_NOTEBOOK,
            notebookNode: notebookNode
        });

        FileAgent.exist(notebookPath, function(path, exist, isDir, error) {
            if (error) {
                return NotebookDispatcher.dispatch({
                    actionType: NotebookActionConstants.NOTEBOOK_DATABASE_TRASH_NOTEBOOK_ERROR,
                    error: "fs error: " + error
                });
            }

            if (!exist) {
                return NotebookDispatcher.dispatch({
                    actionType: NotebookActionConstants.NOTEBOOK_DATABASE_TRASH_NOTEBOOK_ERROR,
                    error: "notebook (id = " + notebookNode.id + ") not found"
                });
            }

            FileAgent.remove(notebookPath, function(path, error) {
                if (error) {
                    NotebookDispatcher.dispatch({
                        actionType: NotebookActionConstants.NOTEBOOK_DATABASE_TRASH_NOTEBOOK_ERROR,
                        error: "unable to remove notebook (id = " + notebookNode.id + ") : " + error
                    });
                }

                NotebookDispatcher.dispatch({
                    actionType: NotebookActionConstants.NOTEBOOK_DATABASE_TRASH_NOTEBOOK_SUCCESS,
                    notebookNode: notebookNode
                });
            });
        });
    },

    /**
     * Select a notebook
     * @method selectNotebook
     * @param notebookNode {Object} jqTree node of notebook to be selected
     */
    selectNotebook: function(notebookNode) {
        if (!databaseStorage) return;

        NotebookDispatcher.dispatch({
            actionType: NotebookActionConstants.NOTEBOOK_DATABASE_SELECT_NOTEBOOK,
            notebookNode: notebookNode
        });
    },

    /**
     * Load notes from notebook
     * @method loadNotes
     * @param notebookNode {Object} jqTree node of notebook to be loaded
     * @param searchString {String} Load notes which contain search string only
     */
    loadNotes: function(notebookNode, searchString) {
        if (!databaseStorage) return;

        var __loadNotes = function(_this, node, cb) {
            var _noteDescriptors = [];
            var _notebookPath = _this.__getBookshelfPath(node.id);

            FileAgent.statList(_notebookPath, function(path, ids, stats, error) {
                if (error) {
                    return NotebookDispatcher.dispatch({
                        actionType: NotebookActionConstants.NOTEBOOK_DATABASE_LOADNOTES_ERROR,
                        notebookNode: node,
                        searchString: searchString,
                        error: "stat list error: " + _notebookPath + " : " + error
                    });
                }

                if (ids.length === 0) {
                    return cb([]);
                }

                (function __iterateIds(i) {
                    var noteId = ids[i];
                    var _noteIndexPath = path + "/" + noteId + "/" + NotebookConstants.DATABASE_NOTE_FILE;

                    async.series([
                        function(callback) {
                            if (!searchString)
                                return callback(null, true);

                            FileAgent.grep(_noteIndexPath, searchString, {
                                    encoding: 'utf8',
                                    regExpModifiers: 'gi',
                                    onlyMatching: false,
                                    onlyTesting: true,
                                    parseFormat: true
                                },
                                function(_path, data, error) {
                                    if (error)
                                        return callback("Operation: File.Grep\n\nMessage: " + error, false);

                                    if (data)
                                        callback(null, true);
                                    else
                                        callback("NO_MATCH", true);
                                }
                            );
                        },
                        function(callback) {
                            FileAgent.grep(_noteIndexPath, "<title>(.*?)<\/title>",
                                {
                                    regExpModifiers: 'i',
                                    onlyMatching: true
                                },
                                function(path, data, error) {
                                    if (error)
                                        return callback("Operation: File.Grep\n\nMessage: " + error, false);

                                    if (!data)
                                        return callback("Operation: File.Grep\n\nMessage: Invalid Format\n\nFile: " + _noteIndexPath, true);

                                    _noteDescriptors.push({
                                        notebookNode: node,
                                        noteId: noteId,
                                        noteStat: stats[i],
                                        noteTitle: data[1],
                                        noteContent: ""
                                    });

                                    callback(null, true);
                                }
                            );
                        }
                    ], function(error, results) {
                        if (error && error !== "NO_MATCH") {
                            NotebookDispatcher.dispatch({
                                actionType: NotebookActionConstants.NOTEBOOK_DATABASE_LOADNOTES_ERROR,
                                notebookNode: node,
                                searchString: searchString,
                                error: error
                            });

                            if (!results[0] || !results[1])
                                return;
                        }

                        if (i === ids.length - 1)
                            cb(_noteDescriptors);
                        else
                            setTimeout(__iterateIds, 1, i + 1);
                    });
                })(0);
            });
        }

        NotebookDispatcher.dispatch({
            actionType: NotebookActionConstants.NOTEBOOK_DATABASE_LOADNOTES,
            notebookNode: notebookNode,
            searchString: searchString
        });

        if (notebookNode.id === NotebookConstants.DATABASE_NOTEBOOK_ALL_ID) {
            var _rootNode = notebookNode.parent;
            var _noteMergedDescriptors = [];
            var _total = 0, _count = 0, _busy = false;
            var _timerWaitBusy = null;

            for (var _i = 0; _i < _rootNode.children.length; _i++) {
                var _node = _rootNode.children[_i];
                if (_node.id === NotebookConstants.DATABASE_NOTEBOOK_ALL_ID
                    || _node.id === NotebookConstants.DATABASE_NOTEBOOK_SEARCH_ID)
                    continue;
                _total += _node.children.length || 1;
            }

            if (_total === 0)
                return NotebookDispatcher.dispatch({
                    actionType: NotebookActionConstants.NOTEBOOK_DATABASE_LOADNOTES_SUCCESS,
                    notebookNode: notebookNode,
                    searchString: searchString,
                    noteDescriptors: []
                });

            _rootNode.iterate(function(child, level) {
                if (child.id === NotebookConstants.DATABASE_NOTEBOOK_ALL_ID
                    || child.id === NotebookConstants.DATABASE_NOTEBOOK_SEARCH_ID
                    || level > 2)
                    return false;

                if (child.children.length > 0)
                    return true;

                __loadNotes(this, child, function(noteDescriptors) {
                    function __mergeNotes(noteDescriptors) {
                        if (_busy) {
                            _timerWaitBusy = setTimeout(__mergeNotes, 50, noteDescriptors);
                            return;
                        }

                        _busy = true;
                        _noteMergedDescriptors = _noteMergedDescriptors.concat(noteDescriptors);

                        if (++_count === _total) {
                            NotebookDispatcher.dispatch({
                                actionType: NotebookActionConstants.NOTEBOOK_DATABASE_LOADNOTES_SUCCESS,
                                notebookNode: notebookNode,
                                searchString: searchString,
                                noteDescriptors: _noteMergedDescriptors
                            });
                        }

                        _busy = false;
                    }

                    if (_busy)
                        _timerWaitBusy = setTimeout(__mergeNotes, 50, noteDescriptors);
                    else
                        __mergeNotes(noteDescriptors);
                });

                return true;
            }.bind(this));
        }
        else if (notebookNode.isFolder()) {
            var _stackNotes = [];
            var _count = 0, _busy = false;
            var _timerWaitBusy = null;

            if (notebookNode.children.length === 0)
                return NotebookDispatcher.dispatch({
                    actionType: NotebookActionConstants.NOTEBOOK_DATABASE_LOADNOTES_SUCCESS,
                    notebookNode: notebookNode,
                    noteDescriptors: []
                });

            notebookNode.iterate(function(child, level) {
                __loadNotes(this, child, function(noteDescriptors) {
                    function __mergeNotes(noteDescriptors) {
                        if (_busy) {
                            _timerWaitBusy = setTimeout(__mergeNotes, 50, noteDescriptors);
                            return;
                        }

                        _busy = true;
                        _stackNotes = _stackNotes.concat(noteDescriptors);

                        if (++_count === notebookNode.children.length) {
                            NotebookDispatcher.dispatch({
                                actionType: NotebookActionConstants.NOTEBOOK_DATABASE_LOADNOTES_SUCCESS,
                                notebookNode: notebookNode,
                                noteDescriptors: _stackNotes
                            });
                        }

                        _busy = false;
                    }

                    if (_busy)
                        _timerWaitBusy = setTimeout(__mergeNotes, 50, noteDescriptors);
                    else
                        __mergeNotes(noteDescriptors);
                });
                return true;
            }.bind(this));
        }
        else {
            __loadNotes(this, notebookNode, function(noteDescriptors) {
                NotebookDispatcher.dispatch({
                    actionType: NotebookActionConstants.NOTEBOOK_DATABASE_LOADNOTES_SUCCESS,
                    notebookNode: notebookNode,
                    noteDescriptors: noteDescriptors
                });
            });
        }
    },

    /**
     * Select a note
     * @method selectNote
     * @param index {Number} Index of selected note
     */
    selectNote: function(index) {
        if (!databaseStorage) return;

        NotebookDispatcher.dispatch({
            actionType: NotebookActionConstants.NOTEBOOK_DATABASE_SELECT_NOTE,
            index: index
        });
    },

    /**
     * Set a sort method for note list
     * @method setNoteSortMethod
     * @param method {Function} Sort method function
     */
    setNoteSortMethod: function(method) {
        if (!databaseStorage) return;

        NotebookDispatcher.dispatch({
            actionType: NotebookActionConstants.NOTEBOOK_DATABASE_SET_NOTE_SORT_METHOD,
            method: method
        });
    },

    /**
     * Add a new note and dispatch a new NoteDescriptor object to NotebookStore.
     * @method addNote
     * @param notebookNode {Object} jqTree node of notebook where new note to be added
     * @param title {String} Note title string
     * @param content {String} Note content string
     */
    addNote: function(notebookNode, title, content) {
        if (!databaseStorage) return;

        var self = this;

        NotebookDispatcher.dispatch({
            actionType: NotebookActionConstants.NOTEBOOK_DATABASE_ADD_NOTE,
            notebookNode: notebookNode
        });

        var noteId = getTimecode();
        var notePath = this.__getBookshelfPath(notebookNode.id + "/" + noteId);

        FileAgent.exist(notePath, function(path, exist, isDir, error) {
            if (error) {
                return NotebookDispatcher.dispatch({
                    actionType: NotebookActionConstants.NOTEBOOK_DATABASE_ADD_NOTE_ERROR,
                    notebookNode: notebookNode,
                    error: "fs error: " + error
                });
            }

            if (!exist) {
                FileAgent.createDirectory(path, function(path, error) {
                    if (error) {
                        return NotebookDispatcher.dispatch({
                            actionType: NotebookActionConstants.NOTEBOOK_DATABASE_ADD_NOTE_ERROR,
                            notebookNode: notebookNode,
                            error: "unable to create directory: " + error
                        });
                    }

                    if (!title || title.trim() === "")
                        title = "Untitled";

                    content = content || "<p></p>";
                    var emptyNote = "<html><head><title>" + title + "</title></head>" +
                                    "<body style='margin:0 auto;'>" + content + "</body></html>";

                    FileAgent.writeFile(path + "/" + NotebookConstants.DATABASE_NOTE_FILE, emptyNote, function(indexPath, progress, error) {
                        if (error) {
                            return NotebookDispatcher.dispatch({
                                actionType: NotebookActionConstants.NOTEBOOK_DATABASE_ADD_NOTE_ERROR,
                                notebookNode: notebookNode,
                                error: "unable to write " + NotebookConstants.DATABASE_NOTE_FILE + ": " + error
                            });
                        }

                        FileAgent.stat(indexPath, function(indexPath, stat, error) {
                            if (error) {
                                return NotebookDispatcher.dispatch({
                                    actionType: NotebookActionConstants.NOTEBOOK_DATABASE_ADD_NOTE_ERROR,
                                    notebookNode: notebookNode,
                                    error: "unable to get stat (" + path + "): " + error
                                });
                            }

                            FileAgent.createDirectory(path + "/assets", function(assetsPath, error) {
                                if (error) {
                                    return NotebookDispatcher.dispatch({
                                        actionType: NotebookActionConstants.NOTEBOOK_DATABASE_ADD_NOTE_ERROR,
                                        notebookNode: notebookNode,
                                        error: "unable to create assets directory: " + error
                                    });
                                }

                                /**
                                 * @define NoteDescriptor
                                 * @member notebookNode {Object} Notebook node object
                                 * @member noteId       {Number} Note ID
                                 * @member noteStat     {Object} Note file state information
                                 * @member noteTitle    {String} Note list item title text
                                 * @member noteContent  {String} Note content in HTML format
                                 */
                                NotebookDispatcher.dispatch({
                                    actionType: NotebookActionConstants.NOTEBOOK_DATABASE_ADD_NOTE_SUCCESS,
                                    noteDescriptor: {
                                        notebookNode: notebookNode,
                                        noteId: noteId,
                                        noteStat: stat,
                                        noteTitle: title,
                                        noteContent: ""
                                    }
                                });
                            });
                        });
                    });
                });
            }
            else {
                /* Recursively call addNote to get different timecode as note path name */
                self.addNote(notebookNode, title, content);
            }
        });
    },

    /**
     * Copy note
     * @method copyNote
     * @param noteDescriptor {Object} NoteDescriptor object of note to be copied
     */
    copyNote: function(noteDescriptor) {
        if (!databaseStorage) return;

        var self = this;

        NotebookDispatcher.dispatch({
            actionType: NotebookActionConstants.NOTEBOOK_DATABASE_COPY_NOTE,
            srcNoteDescriptor: noteDescriptor
        });

        var notePath = this.__getNotePath(noteDescriptor);

        FileAgent.exist(notePath, function(path, exist, isDir, error) {
            if (error) {
                return NotebookDispatcher.dispatch({
                    actionType: NotebookActionConstants.NOTEBOOK_DATABASE_COPY_NOTE_ERROR,
                    srcNoteDescriptor: noteDescriptor,
                    error: "fs error: " + error
                });
            }

            if (exist) {
                var _copyNoteId = getTimecode();
                var _copyNotePath = dirname(notePath) + "/" + _copyNoteId;

                FileAgent.copy(notePath, _copyNotePath, function(srcPath, dstPath, error) {
                    if (error) {
                        return NotebookDispatcher.dispatch({
                            actionType: NotebookActionConstants.NOTEBOOK_DATABASE_COPY_NOTE_ERROR,
                            srcNoteDescriptor: noteDescriptor,
                            error: "unable to copy " + notePath + ": " + error
                        });
                    }

                    FileAgent.readFile(dstPath + "/" + NotebookConstants.DATABASE_NOTE_FILE, "utf8", function(path, data, error) {
                        if (error) {
                            return NotebookDispatcher.dispatch({
                                actionType: NotebookActionConstants.NOTEBOOK_DATABASE_COPY_NOTE_ERROR,
                                srcNoteDescriptor: noteDescriptor,
                                error: "unable to read " + path + ": " + error
                            });
                        }

                        FileAgent.grep(path, "<title>(.*?)<\/title>",
                            {
                                regExpModifiers: 'i',
                                onlyMatching: true
                            },
                            function(path, title, error) {
                                if (error) {
                                    return NotebookDispatcher.dispatch({
                                        actionType: NotebookActionConstants.NOTEBOOK_DATABASE_COPY_NOTE_ERROR,
                                        srcNoteDescriptor: noteDescriptor,
                                        error: "grep src error: " + error
                                    });
                                }

                                var _noteTitle = title[1];

                                var re = new RegExp(srcPath, "g");
                                data = data.replace(re, dstPath);

                                FileAgent.writeFile(dstPath + "/" + NotebookConstants.DATABASE_NOTE_FILE, data, function(path, progress, error) {
                                    if (error) {
                                        return NotebookDispatcher.dispatch({
                                            actionType: NotebookActionConstants.NOTEBOOK_DATABASE_COPY_NOTE_ERROR,
                                            srcNoteDescriptor: noteDescriptor,
                                            error: "unable to write " + path + ": " + error
                                        });
                                    }

                                    FileAgent.stat(dstPath, function(path, stat, error) {
                                        if (error) {
                                            return NotebookDispatcher.dispatch({
                                                actionType: NotebookActionConstants.NOTEBOOK_DATABASE_COPY_NOTE_ERROR,
                                                srcNote: noteDescriptor,
                                                error: "unable to get stat of " + path + ": " + error
                                            });
                                        }

                                        NotebookDispatcher.dispatch({
                                            actionType: NotebookActionConstants.NOTEBOOK_DATABASE_COPY_NOTE_SUCCESS,
                                            srcNoteDescriptor: noteDescriptor,
                                            dstNoteDescriptor: {
                                                notebookNode: noteDescriptor.notebookNode,
                                                noteId: _copyNoteId,
                                                noteStat: stat,
                                                noteTitle: _noteTitle
                                            }
                                        });
                                    });
                                });
                            }
                        );
                    });
                });
            }
        });
    },

    /**
     * Trash note
     * @method trashNote
     * @param noteDescriptor {Object} NoteDescriptor object of note to be removed
     */
    trashNote: function(noteDescriptor) {
        if (!databaseStorage) return;

        var notePath = this.__getNotePath(noteDescriptor);

        NotebookDispatcher.dispatch({
            actionType: NotebookActionConstants.NOTEBOOK_DATABASE_TRASH_NOTE,
            noteDescriptor: noteDescriptor
        });

        FileAgent.exist(notePath, function(path, exist, isDir, error) {
            if (error) {
                return NotebookDispatcher.dispatch({
                    actionType: NotebookActionConstants.NOTEBOOK_DATABASE_TRASH_NOTE_ERROR,
                    noteDescriptor: noteDescriptor,
                    error: "fs error: " + error
                });
            }

            if (exist) {
                FileAgent.remove(notePath, function(path, error) {
                    if (error) {
                        return NotebookDispatcher.dispatch({
                            actionType: NotebookActionConstants.NOTEBOOK_DATABASE_TRASH_NOTE_ERROR,
                            noteDescriptor: noteDescriptor,
                            error: "unable to remove " + notePath + ": " + error
                        });
                    }

                    NotebookDispatcher.dispatch({
                        actionType: NotebookActionConstants.NOTEBOOK_DATABASE_TRASH_NOTE_SUCCESS,
                        noteDescriptor: noteDescriptor
                    });
                });
            }
        });
    },

    /**
     * Read note title and content
     * @method readNote
     * @param noteDescriptor {Object} NoteDescriptor object of note to be loaded
     */
    readNote: function(noteDescriptor) {
        if (!databaseStorage) return;

        function __replaceQueryString(url, param, value) {
            var re = new RegExp("([?|&])" + param + "=.*?(&|$|\")","ig");
            if (url.match(re))
                return url.replace(re,'$1' + param + "=" + value + '$2');
            else
                return url;
        }

        var notePath = this.__getNotePath(noteDescriptor);

        NotebookDispatcher.dispatch({
            actionType: NotebookActionConstants.NOTEBOOK_DATABASE_READ_NOTE,
            noteDescriptor: noteDescriptor
        });

        FileAgent.readFile(notePath + "/" + NotebookConstants.DATABASE_NOTE_FILE, "utf8", function(path, data, error) {
            if (error) {
                return NotebookDispatcher.dispatch({
                    actionType: NotebookActionConstants.NOTEBOOK_DATABASE_READ_NOTE_ERROR,
                    noteDescriptor: noteDescriptor,
                    error: "unable to read " + path + ": " + error
                });
            }

            /* Remove all single &nbsp; between tags, and extract contents inside <body></body> */
            var content = data.replace(/\>&nbsp;\</gi,'\>\<')
                              .match(/\<body[^>]*\>([^]*)\<\/body/m)[1] || "";
            noteDescriptor.noteContent = __replaceQueryString(content, "uuid", databaseStorage.uuid);

            NotebookDispatcher.dispatch({
                actionType: NotebookActionConstants.NOTEBOOK_DATABASE_READ_NOTE_SUCCESS,
                noteDescriptor: noteDescriptor
            });
        });
    },

    /**
     * Cache dirty note content before saving
     * @method cacheDirtyNote
     * @param noteDescriptor {Object} NoteDescriptor object of note
     * @param dirtyTitle {String} Dirty note title
     * @param dirtyContent {String} Dirty (Modifing) note content
     */
    cacheDirtyNote: function(noteDescriptor, dirtyTitle, dirtyContent) {
        if (noteDescriptor.noteTitle !== dirtyTitle || noteDescriptor.noteContent !== dirtyContent) {
            noteDescriptor.dirtyNoteTitle = dirtyTitle;
            noteDescriptor.dirtyNoteContent = dirtyContent;

            NotebookDispatcher.dispatch({
                actionType: NotebookActionConstants.NOTEBOOK_DATABASE_CACHE_DIRTY_NOTE,
                noteDescriptor: noteDescriptor
            });
        }
        else {
            noteDescriptor.dirtyNoteTitle = null;
            noteDescriptor.dirtyNoteContent = null;
        }
    },

    /**
     * Save note content, if the content has no change, do nothing and just return.
     * @mehotd saveNote
     * @param noteDescriptor {Object} NoteDescriptor object of note to be saved
     * @return {Boolean} false if note has no change and do no action, otherwise return true.
     */
    saveNote: function(noteDescriptor) {
        if (!databaseStorage) return false;
        if (!noteDescriptor.dirtyNoteTitle && !noteDescriptor.dirtyNoteContent) return false;

        var self = this;
        var notePath = this.__getNotePath(noteDescriptor);

        NotebookDispatcher.dispatch({
            actionType: NotebookActionConstants.NOTEBOOK_DATABASE_SAVE_NOTE,
            noteDescriptor: noteDescriptor
        });

        /**
         * Grab HTML resources procedure:
         * 1) Find cross site resources (<img src='http://www.somewhere.com/image.jpg'>)
         * 2) Download cross site resources to our assets folder
         * 3) Replace cross site resource URL with our assets URL
         */
        function __grabResources(content, cb) {
            var _imgs = content.match(/<img[^>]+src="?([^"\s]+)"?[^>]*\/>/gi);

            if (_imgs && _imgs.length > 0) {
                var _imgName = getTimecode();

                function __replaceResource(i) {
                    var _src = $(_imgs[i]).attr('src');
                    var _ext = _src.split(".").pop().split("?")[0];
                    var _fileUploadName = (parseInt(_imgName) + i).toString() + (_ext ? "." + _ext : "");

                    function __grabNext() {
                        if (i === _imgs.length - 1)
                            cb && cb(content);
                        else
                            __replaceResource(i + 1);
                    }

                    /* Test if resource is from local URL, if note, download it to userdata */
                    if (
                        !(new RegExp(/^(userdata)/)).test(_src) &&
                        !(new RegExp(/^(\/apps\/[bc]\/)/)).test(_src)
                    ) {
                        FileAgent.saveUrlAs(notePath + "/assets/" + _fileUploadName, _src, function(path, error) {
                            if (error) {
                                // TODO: embed error message in content
                                console.log("Unable to save file from URL " + _src);
                            }
                            else
                                content = content.replace(
                                    new RegExp(_src, 'g'),
                                    "userdata/" + path + (databaseStorage.uuid? "?uuid=" + databaseStorage.uuid : "")
                                );

                            __grabNext();
                        });
                    }
                    else {
                        __grabNext();
                    }
                }

                __replaceResource(0);
            }
            else
                cb && cb(content);
        }

        /**
         * Saving the note:
         * 1) Build full note document with title and content
         * 2) Write note to file
         * 3) Generate latest note summary
         * 4) Update latest modified date by touch
         */
        function __save(title, content, cb) {
            if (!title || title.trim() === "")
                title = "Untitled";

            var _doc = "<html><head><title>" + title + "</title></head><body>" + content + "</body></html>";

            if (noteDescriptor.noteTitle === title && noteDescriptor.noteContent === content)
                return (cb && cb());

            FileAgent.writeFile(notePath  + "/" + NotebookConstants.DATABASE_NOTE_FILE, _doc, function(path, progress, error) {
                if (error)
                    return (cb && cb("unable to write " + path + ": " + error));

                /* Update summary.json */
                self.saveNoteSummary(noteDescriptor, { title: title }, function(summary, error) {
                    if (error)
                        return (cb && cb("unable to update " + path + ": " + error));

                    /* Update last modified time */
                    FileAgent.touch(notePath, function(path, error) {
                        if (error)
                            return (cb && cb("unable to touch " + path + ": " + error));

                        FileAgent.stat(notePath, function(path, stat, error) {
                            if (error)
                                return (cb && cb("unable to get stat of " + path + ": " + error));

                            noteDescriptor.noteTitle = title;
                            noteDescriptor.noteContent = content;
                            noteDescriptor.noteSummary = summary;
                            noteDescriptor.noteStat = stat;
                            noteDescriptor.dirtyNoteTitle = null;
                            noteDescriptor.dirtyNoteContent = null;
                            return (cb && cb());
                        });
                    });
                });
            });
        }

        __grabResources(noteDescriptor.dirtyNoteContent, function(grabbedContent) {
            __save(noteDescriptor.dirtyNoteTitle, grabbedContent, function(error) {
                if (error)
                    return NotebookDispatcher.dispatch({
                        actionType: NotebookActionConstants.NOTEBOOK_DATABASE_SAVE_NOTE_ERROR,
                        noteDescriptor: noteDescriptor,
                        error: error
                    });

                NotebookDispatcher.dispatch({
                    actionType: NotebookActionConstants.NOTEBOOK_DATABASE_SAVE_NOTE_SUCCESS,
                    noteDescriptor: noteDescriptor
                });
            });
        });

        return true;
    },

    /**
     * Create or merge note summary and save it to summary.json
     * @method saveNoteSummary
     * @param noteDescriptor {Object} NoteDescriptor object of note
     * @param summary {Object} JSON summary object
     * @param callback {Function} Callback function with summary object or error message passed in
     */
    saveNoteSummary: function(noteDescriptor, summary, callback) {
        var notePath = this.__getNotePath(noteDescriptor);
        var summaryPath = notePath + "/summary.json";

        FileAgent.exist(summaryPath, function(path, exist, isDir, error) {
            if (error) {
                callback(null, error);
            }
            else if (exist) {
                FileAgent.readFile(summaryPath, "utf8", function(path, data, error) {
                    if (error) {
                        callback(null, error);
                    }
                    else {
                        try {
                            var _newSummary = assign(JSON.parse(data), summary);

                            FileAgent.writeFile(summaryPath, JSON.stringify(_newSummary), function(path, progress, error) {
                                if (error)
                                    callback(null, error);
                                else
                                    callback(_newSummary, null);
                            });
                        }
                        catch (error) {
                            callback(null, error);
                        }
                    }
                });
            }
            else {
                FileAgent.writeFile(summaryPath, JSON.stringify(summary), function(path, progress, error) {
                    if (error)
                        callback(null, error);
                    else
                        callback(summary, null);
                });
            }
        });
    },

    /**
     * Renew note modified date. Usually used to update last modified date of manually saved note after flushing
     * other dirty notes to ensure the manually saved note has latest modified date.
     * @method renewNoteModifyDate
     * @param noteDescriptor {Object} NoteDescriptor object of note
     */
    renewNoteModifyDate: function(noteDescriptor) {
        var notePath = this.__getNotePath(noteDescriptor);

        FileAgent.touch(notePath, function(path, error) {
            if (error) {
                FileAgent.stat(notePath, function(path, stat, error) {
                    if (!error)
                        noteDescriptor.noteStat = stat;
                });
            }
        });
    },

    /**
     * Clear unused note assets
     * @method clearUselessAssets
     * @param noteDescriptor {Object} NoteDescriptor object of note to be clearring useless assets
     * @param afterDelay {Number} Delay a period of time (in millisecond) before clearing useless assets
     */
    clearUselessAssets: function(noteDescriptor, afterDelay) {
        if (!databaseStorage) return;

        var notePath = this.__getNotePath(noteDescriptor);

        function __removeUseless(items, i, cb) {
            FileAgent.grep(notePath  + "/" + NotebookConstants.DATABASE_NOTE_FILE, items[i], null, function(path, data, error) {
                if (error)
                    return (cb && cb("unable to read " + path + ": " + error));

                if (!data) {
                    console.log("Prepare to remove unused asset '" + items[i]);

                    FileAgent.remove(notePath + "/assets/" + items[i], function(path, error) {
                        if (error)
                            return (cb && cb("unable to remove " + path + ": " + error));

                        console.log("Unused asset '" + items[i] + "' removed");
                        if (i === items.length - 1)
                            cb && cb();
                        else
                            __removeUseless(items, i + 1, cb);
                    });
                }
                else {
                    if (i === items.length - 1)
                        cb && cb();
                    else
                        __removeUseless(items, i + 1, cb);
                }
            });
        }

        setTimeout(function() {
            NotebookDispatcher.dispatch({
                actionType: NotebookActionConstants.NOTEBOOK_DATABASE_CLEAR_USELESS_NOTE_ASSETS,
                noteDescriptor: noteDescriptor
            });

            FileAgent.list(notePath + "/assets", function(path, items, error) {
                if (error)
                    return NotebookDispatcher.dispatch({
                        actionType: NotebookActionConstants.NOTEBOOK_DATABASE_CLEAR_USELESS_NOTE_ASSETS_ERROR,
                        noteDescriptor: noteDescriptor,
                        error: "unable to list " + path + ": " + error
                    });

                if (items.length > 0)
                    __removeUseless(items, 0, function(error) {
                        if (error)
                            NotebookDispatcher.dispatch({
                                actionType: NotebookActionConstants.NOTEBOOK_DATABASE_CLEAR_USELESS_NOTE_ASSETS_ERROR,
                                noteDescriptor: noteDescriptor,
                                error: error
                            });
                        else
                            NotebookDispatcher.dispatch({
                                actionType: NotebookActionConstants.NOTEBOOK_DATABASE_CLEAR_USELESS_NOTE_ASSETS_SUCCESS,
                                noteDescriptor: noteDescriptor
                            });
                    });
                else
                    NotebookDispatcher.dispatch({
                        actionType: NotebookActionConstants.NOTEBOOK_DATABASE_CLEAR_USELESS_NOTE_ASSETS_SUCCESS,
                        noteDescriptor: noteDescriptor
                    });
            });
        }, afterDelay);
    },

    /**
     * Take note snapshot image
     * @method takeNoteSnapshot
     * @param noteDescriptor {Object} NoteDescriptor object of note to be taking snapshot
     * @param snapshotDOMContainer {Object} jQuery object of note snapshot container
     * @param width {Number} Snapshot image width
     * @param height {Number} Snapshot image height
     */
    takeNoteSnapshot: function(noteDescriptor, snapshotDOMContainer, width, height) {
        if (!databaseStorage) return;

        var snapshotPath = this.__getBookshelfPath(
            noteDescriptor.notebookNode.id + "/" + noteDescriptor.noteId + "/" + NotebookConstants.DATABASE_NOTE_SNAPSHOT_FILE
        );

        NotebookDispatcher.dispatch({
            actionType: NotebookActionConstants.NOTEBOOK_DATABASE_TAKE_NOTE_SNAPSHOT,
            noteDescriptor: noteDescriptor
        });

        html2canvas(snapshotDOMContainer, {
            allowTaint: false,
            taintTest: false,
            onrendered: function(canvas) {
                var dataUrl = canvas.toDataURL("image/png");
                var data = dataUrl.replace(/^data:image\/png;base64,/, "");

                FileAgent.writeFile(snapshotPath, base64ToBlob(data), function(path, progress, error) {
                    if (error)
                        NotebookDispatcher.dispatch({
                            actionType: NotebookActionConstants.NOTEBOOK_DATABASE_TAKE_NOTE_SNAPSHOT_ERROR,
                            noteDescriptor: noteDescriptor,
                            error: "unable to write snapshot to " + path + ": " + error
                        });
                    else
                        NotebookDispatcher.dispatch({
                            actionType: NotebookActionConstants.NOTEBOOK_DATABASE_TAKE_NOTE_SNAPSHOT_SUCCESS,
                            noteDescriptor: noteDescriptor
                        });
                });
            },
            width: width,
            height: height
        });
    },

    /**
     * Upload files to note assets folder of the note
     * @method attachFilesToNote
     * @param noteDescriptor {Object} NoteDescriptor object of note to attach file
     * @param files {Array} File object array containing files to upload
     */
    attachFilesToNote: function(noteDescriptor, files) {
        var notePath = this.__getNotePath(noteDescriptor);

        NotebookDispatcher.dispatch({
            actionType: NotebookActionConstants.NOTEBOOK_DATABASE_ATTACH_FILE_TO_NOTE,
            noteDescriptor: noteDescriptor,
            files: files
        });

        function __uploadFile(fileObject, onComplete, onProgress, onError) {
            if (!fileObject.type) {
                onError("Directory uploading is not supported");
                onComplete();
                return;
            }

            var _ext = fileObject.name.split(".").pop();
            _ext = _ext ? "." + _ext : "";

            noteDescriptor.fileUploadName = getTimecode() + _ext;
            noteDescriptor.fileUploadPath = notePath + "/assets/" + noteDescriptor.fileUploadName;
            noteDescriptor.fileUploadStream = FileAgent.writeFile(
                noteDescriptor.fileUploadPath,
                fileObject,
                /* onComplete */
                function(path, progress, error) {
                    if (error)
                        onError(error);
                    else {
                        noteDescriptor.fileUploadName = null;
                        noteDescriptor.fileUploadStream = null;
                        onProgress(100);
                        onComplete();
                    }
                },
                /* onProgress */
                function(path, progress, error) {
                    if (error)
                        onError(error);
                    else
                        onProgress(progress);
                }
            );
        }

        (function __iterate(index, files) {
            if (index < files.length) {
                __uploadFile(files[index], function() {
                        __iterate(index + 1, files);
                    },
                    function(progress) {
                        var _frag = 100 / files.length;
                        NotebookDispatcher.dispatch({
                            actionType: NotebookActionConstants.NOTEBOOK_DATABASE_ATTACH_FILE_TO_NOTE_PROGRESS,
                            noteDescriptor: noteDescriptor,
                            fileObject: files[index],
                            progress: progress,
                            overallProgress: Math.ceil((_frag * index) + (_frag * progress / 100))
                        });
                    },
                    function(error) {
                        NotebookDispatcher.dispatch({
                            actionType: NotebookActionConstants.NOTEBOOK_DATABASE_ATTACH_FILE_TO_NOTE_ERROR,
                            noteDescriptor: noteDescriptor,
                            fileObject: files[index],
                            error: error
                        });
                    });
            }
            else {
                FileAgent.touch(notePath + "/assets");
                NotebookDispatcher.dispatch({
                    actionType: NotebookActionConstants.NOTEBOOK_DATABASE_ATTACH_FILE_TO_NOTE_SUCCESS,
                    noteDescriptor: noteDescriptor,
                    files: files
                });
            }
        })(0, files);
    },

    /**
     * Cancel uploading file
     * @method cancelAttachFile
     * @param noteDescriptor {Object} NoteDescriptor object which contains uploading file information for cancelling
     */
    cancelAttachFile: function(noteDescriptor) {
        if (noteDescriptor.fileUploadStream) {
            FileAgent.stopWriteStream(
                this.__getNotePath(noteDescriptor) + "/assets/" + noteDescriptor.fileUploadName,
                noteDescriptor.fileUploadStream
            );

            NotebookDispatcher.dispatch({
                actionType: NotebookActionConstants.NOTEBOOK_DATABASE_CANCEL_ATTACH_FILE_TO_NOTE,
                noteDescriptor: noteDescriptor
            });
        }
    }
}

module.exports = DatabaseActionCreators;
