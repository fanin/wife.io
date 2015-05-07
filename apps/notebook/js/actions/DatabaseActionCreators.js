var NotebookDispatcher = require('../dispatcher/NotebookDispatcher');
var NotebookConstants  = require('../constants/NotebookConstants');
var getTimecode        = require('utils/string-code').getTimecode;
var dirname            = require('utils/client-utils').dirname;

var DATABASE_ROOT_FOLDER = "bookshelf";
var DATABASE_TREE_FILE   = "bookshelf-tree.json";
var DATABASE_NOTE_FILE   = "index.html";
var DATABASE_FIRST_ENTRY_LABEL = "All Notes";

var saveWaitTimer;

var DatabaseActionCreators = {

    /**
     * Build real path from given path string
     * @method __getPath
     * @param path {object/string} Relative path string
     * @private
     */
    __getPath: function(path) {
        path = path || "";
        return DATABASE_ROOT_FOLDER + "/" + path;
    },

    __getLastModifiedDate: function(stat) {
        var _mtime = new Date(stat.mtime);
        return _mtime.toLocaleDateString() + " " + _mtime.toLocaleTimeString();
    },

    /**
     * Load notebook tree from database
     * @method loadTree
     */
    loadTree: function() {
        var treeData = [{ label: DATABASE_FIRST_ENTRY_LABEL, id: 1 }];

        NotebookDispatcher.dispatch({
            actionType: NotebookConstants.NOTEBOOK_DATABASE_LOADTREE
        });

        /* Create /bookshelf if necessary */
        FileAgent.exist(this.__getPath(), function(path, exist, isDir, error) {
            if (error) {
                return NotebookDispatcher.dispatch({
                    actionType: NotebookConstants.NOTEBOOK_DATABASE_LOADTREE_ERROR,
                    error: "fs error: " + error
                });
            }

            if (!exist) {
                FileAgent.createDirectory(this.__getPath(), function(path, error) {
                    if (error) {
                        NotebookDispatcher.dispatch({
                            actionType: NotebookConstants.NOTEBOOK_DATABASE_LOADTREE_ERROR,
                            error: "unable to create " + path + ", error: " + error
                        });
                    }
                });
            }
            else if (exist && !isDir) {
                FileAgent.remove(this.__getPath(), function(path, error) {
                    if (error) {
                        NotebookDispatcher.dispatch({
                            actionType: NotebookConstants.NOTEBOOK_DATABASE_LOADTREE_ERROR,
                            error: "unable to remove " + path + ", error: " + error
                        });
                    }

                    FileAgent.createDirectory(this.__getPath(), function(path, error) {
                        if (error) {
                            NotebookDispatcher.dispatch({
                                actionType: NotebookConstants.NOTEBOOK_DATABASE_LOADTREE_ERROR,
                                error: "unable to create " + path + ", error: " + error
                            });
                        }
                    });
                }.bind(this));
            }
        }.bind(this));

        /* Load notebook tree data from bookshelf-tree.json */
        FileAgent.exist(DATABASE_TREE_FILE, function(path, exist, isDir, error) {
            if (error) {
                return NotebookDispatcher.dispatch({
                    actionType: NotebookConstants.NOTEBOOK_DATABASE_LOADTREE_ERROR,
                    error: "fs error: " + error
                });
            }

            if (exist) {
                FileAgent.readFile(DATABASE_TREE_FILE, "utf8", function(path, data, error) {
                    if (error) {
                        NotebookDispatcher.dispatch({
                            actionType: NotebookConstants.NOTEBOOK_DATABASE_LOADTREE_ERROR,
                            error: "unable to read tree data: " + error
                        });
                    }
                    else {
                        try {
                            treeData = JSON.parse(data);
                        }
                        catch (error) {
                            NotebookDispatcher.dispatch({
                                actionType: NotebookConstants.NOTEBOOK_DATABASE_LOADTREE_ERROR,
                                error: "parse tree data error: " + error + "\ndata:\n" + data
                            });
                        }
                        finally {
                            NotebookDispatcher.dispatch({
                                actionType: NotebookConstants.NOTEBOOK_DATABASE_LOADTREE_SUCCESS,
                                treeData: treeData
                            });
                        }
                    }
                });
            }
            else {
                FileAgent.writeFile(DATABASE_TREE_FILE, JSON.stringify(treeData), function(path, progress, error) {
                    if (error) {
                        NotebookDispatcher.dispatch({
                            actionType: NotebookConstants.NOTEBOOK_DATABASE_LOADTREE_ERROR,
                            error: "unable to write tree data: " + error
                        });
                    }
                    else {
                        NotebookDispatcher.dispatch({
                            actionType: NotebookConstants.NOTEBOOK_DATABASE_LOADTREE_SUCCESS,
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
     * @param treeData {Object} jqTree tree data object
     * @param wait {Number} Wait a period of time in millisecond before saving tree data
     */
    saveTree: function(treeData, wait) {
        wait = wait || 0;

        if (saveWaitTimer) {
            clearTimeout(saveWaitTimer);
        }

        saveWaitTimer = setTimeout(function() {
            saveWaitTimer = undefined;

            NotebookDispatcher.dispatch({
                actionType: NotebookConstants.NOTEBOOK_DATABASE_SAVETREE
            });

            FileAgent.writeFile(DATABASE_TREE_FILE, treeData, function(path, progress, error) {
                if (error) {
                    NotebookDispatcher.dispatch({
                        actionType: NotebookConstants.NOTEBOOK_DATABASE_SAVETREE_ERROR,
                        error: "unable to write tree data: " + error
                    });
                }
                else {
                    NotebookDispatcher.dispatch({
                        actionType: NotebookConstants.NOTEBOOK_DATABASE_SAVETREE_SUCCESS,
                        treeData: treeData
                    });
                }
            });
        }, wait);
    },

    /**
     * Create notebook stack in database
     * @method createStack
     * @param name {String} Stack name
     */
    createStack: function(name) {
        NotebookDispatcher.dispatch({
            actionType: NotebookConstants.NOTEBOOK_DATABASE_CREATE_STACK,
            id: parseInt(getTimecode()),
            name: name
        });
    },

    /**
     * Create a empty notebook in database
     * @method createNotebook
     * @param name {String} Notebook name
     */
    createNotebook: function(name) {
        var code = getTimecode();
        var notebookPath = this.__getPath(code);

        NotebookDispatcher.dispatch({
            actionType: NotebookConstants.NOTEBOOK_DATABASE_CREATE_NOTEBOOK
        });

        FileAgent.exist(notebookPath, function(path, exist, isDir, error) {
            if (error) {
                return NotebookDispatcher.dispatch({
                    actionType: NotebookConstants.NOTEBOOK_DATABASE_CREATE_NOTEBOOK_ERROR,
                    error: "fs operation error: " + error
                });
            }

            if (exist) {
                return NotebookDispatcher.dispatch({
                    actionType: NotebookConstants.NOTEBOOK_DATABASE_CREATE_NOTEBOOK_ERROR,
                    error: "given path is already exist"
                });
            }

            FileAgent.createDirectory(notebookPath, function(path, error) {
                if (error) {
                    NotebookDispatcher.dispatch({
                        actionType: NotebookConstants.NOTEBOOK_DATABASE_CREATE_NOTEBOOK_ERROR,
                        error: "unable to create " + path + ", error: " + error
                    });
                }
                else {
                    NotebookDispatcher.dispatch({
                        actionType: NotebookConstants.NOTEBOOK_DATABASE_CREATE_NOTEBOOK_SUCCESS,
                        id: parseInt(code),
                        name: name
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
        var notebookPath = this.__getPath(notebookNode.id);

        NotebookDispatcher.dispatch({
            actionType: NotebookConstants.NOTEBOOK_DATABASE_TRASH_NOTEBOOK,
            notebookNode: notebookNode
        });

        FileAgent.exist(notebookPath, function(path, exist, isDir, error) {
            if (error) {
                return NotebookDispatcher.dispatch({
                    actionType: NotebookConstants.NOTEBOOK_DATABASE_TRASH_NOTEBOOK_ERROR,
                    error: "fs error: " + error
                });
            }

            if (!exist) {
                return NotebookDispatcher.dispatch({
                    actionType: NotebookConstants.NOTEBOOK_DATABASE_TRASH_NOTEBOOK_ERROR,
                    error: "notebook (id = " + notebookNode.id + ") not found"
                });
            }

            FileAgent.remove(notebookPath, function(path, error) {
                if (error) {
                    NotebookDispatcher.dispatch({
                        actionType: NotebookConstants.NOTEBOOK_DATABASE_TRASH_NOTEBOOK_ERROR,
                        error: "unable to remove notebook (id = " + notebookNode.id + ") : " + error
                    });
                }

                NotebookDispatcher.dispatch({
                    actionType: NotebookConstants.NOTEBOOK_DATABASE_TRASH_NOTEBOOK_SUCCESS,
                    notebookNode: notebookNode
                });
            });
        });
    },

    /**
     * Select a notebook
     * @method selectNotebook
     * @param notebookNode {Number} jqTree node of notebook to be selected
     */
    selectNotebook: function(notebookNode) {
        NotebookDispatcher.dispatch({
            actionType: NotebookConstants.NOTEBOOK_DATABASE_SELECT_NOTEBOOK,
            notebookNode: notebookNode
        });
    },

    /**
     * Load notes from notebook
     * @method loadNotes
     * @param notebookNode {Number} jqTree node of notebook to be loaded
     */
    loadNotes: function(notebookNode) {
        var __loadNotes = function(_this, node, cb) {
            var _notes = [];
            var _notebookPath = _this.__getPath(node.id);

            FileAgent.statList(_notebookPath, function(path, ids, stats, error) {
                if (error) {
                    return NotebookDispatcher.dispatch({
                        actionType: NotebookConstants.NOTEBOOK_DATABASE_LOADNOTES_ERROR,
                        notebookNode: notebookNode,
                        error: "stat list error: " + error
                    });
                }

                if (ids.length === 0) {
                    return cb([]);
                }

                ids.map(function(noteId, i) {
                    var _noteIndexPath = path + "/" + noteId + "/" + DATABASE_NOTE_FILE;
                    FileAgent.grep(_noteIndexPath, "<title>(.*?)<\/title>",
                        {
                            regExpModifiers: 'i',
                            onlyMatching: true
                        },
                        function(path, data, error) {
                            if (error) {
                                return NotebookDispatcher.dispatch({
                                    actionType: NotebookConstants.NOTEBOOK_DATABASE_LOADNOTES_ERROR,
                                    notebookNode: notebookNode,
                                    error: "grep error: " + error
                                });
                            }

                            var _noteTitle = data[1];
                            var _noteLastModDate = _this.__getLastModifiedDate(stats[i]);

                            _notes.push({
                                notebookNode: node,
                                id: noteId,
                                stat: stats[i],
                                titleText: _noteTitle,
                                subtitleText: _noteLastModDate,
                                detailText: ""
                            });

                            if (i === ids.length - 1)
                                cb(_notes);
                        }
                    );
                });
            });
        }

        NotebookDispatcher.dispatch({
            actionType: NotebookConstants.NOTEBOOK_DATABASE_LOADNOTES,
            notebookNode: notebookNode
        });

        if (notebookNode.id === 1) {
            var _rootNode = notebookNode.parent;
            var _allNotes = [];
            var _total = 0, _count = 0;

            for (var _i = 0; _i < _rootNode.children.length; _i++) {
                var _node = _rootNode.children[_i];
                if (_node.id === 1)
                    continue;
                _total += _node.children.length || 1;
            }

            _rootNode.iterate(function(child, level) {
                if (child.id === 1 || level > 2)
                    return false;

                if (child.children.length > 0)
                    return true;

                __loadNotes(this, child, function(notes) {
                    _allNotes = _allNotes.concat(notes);
                    if (++_count === _total) {
                        NotebookDispatcher.dispatch({
                            actionType: NotebookConstants.NOTEBOOK_DATABASE_LOADNOTES_SUCCESS,
                            notebookNode: notebookNode,
                            notes: _allNotes
                        });
                    }
                });

                return true;
            }.bind(this));
        }
        else if (notebookNode.isFolder()) {
            var _stackNotes = [];
            var _count = 0;
            notebookNode.iterate(function(child, level) {
                __loadNotes(this, child, function(notes) {
                    _stackNotes = _stackNotes.concat(notes);
                    if (++_count === notebookNode.children.length) {
                        NotebookDispatcher.dispatch({
                            actionType: NotebookConstants.NOTEBOOK_DATABASE_LOADNOTES_SUCCESS,
                            notebookNode: notebookNode,
                            notes: _stackNotes
                        });
                    }
                });
                return true;
            }.bind(this));
        }
        else {
            __loadNotes(this, notebookNode, function(notes) {
                NotebookDispatcher.dispatch({
                    actionType: NotebookConstants.NOTEBOOK_DATABASE_LOADNOTES_SUCCESS,
                    notebookNode: notebookNode,
                    notes: notes
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
        NotebookDispatcher.dispatch({
            actionType: NotebookConstants.NOTEBOOK_DATABASE_SELECT_NOTE,
            index: index
        });
    },

    /**
     * Set a sort method for note list
     * @method setNoteSortMethod
     * @param method {Function} Sort method function
     */
    setNoteSortMethod: function(method) {
        NotebookDispatcher.dispatch({
            actionType: NotebookConstants.NOTEBOOK_DATABASE_SET_NOTE_SORT_METHOD,
            method: method
        });
    },

    /**
     * Add a new note
     * @method addNote
     * @param notebookNode {Object} jqTree node of notebook where new note to be added
     * @param title {String} Note title string
     * @param content {String} Note content string
     */
    addNote: function(notebookNode, title, content) {
        var self = this;

        NotebookDispatcher.dispatch({
            actionType: NotebookConstants.NOTEBOOK_DATABASE_ADD_NOTE,
            notebookNode: notebookNode
        });

        var noteId = getTimecode();
        var notePath = self.__getPath(notebookNode.id + "/" + noteId);

        FileAgent.exist(notePath, function(path, exist, isDir, error) {
            if (error) {
                return NotebookDispatcher.dispatch({
                    actionType: NotebookConstants.NOTEBOOK_DATABASE_ADD_NOTE_ERROR,
                    notebookNode: notebookNode,
                    error: "fs error: " + error
                });
            }

            if (!exist) {
                FileAgent.createDirectory(path, function(path, error) {
                    if (error) {
                        return NotebookDispatcher.dispatch({
                            actionType: NotebookConstants.NOTEBOOK_DATABASE_ADD_NOTE_ERROR,
                            notebookNode: notebookNode,
                            error: "unable to create directory: " + error
                        });
                    }

                    if (!title || title.trim() === "")
                        title = "Untitled " + noteId;

                    content = content || "<p></p>";
                    var emptyNote = "<html><head><title>" + title + "</title></head>" +
                                    "<body style='margin:0 auto;'>" + content + "</body></html>";

                    FileAgent.writeFile(path + "/" + DATABASE_NOTE_FILE, emptyNote, function(indexPath, progress, error) {
                        if (error) {
                            return NotebookDispatcher.dispatch({
                                actionType: NotebookConstants.NOTEBOOK_DATABASE_ADD_NOTE_ERROR,
                                notebookNode: notebookNode,
                                error: "unable to write " + DATABASE_NOTE_FILE + ": " + error
                            });
                        }

                        FileAgent.stat(indexPath, function(indexPath, stat, error) {
                            if (error) {
                                return NotebookDispatcher.dispatch({
                                    actionType: NotebookConstants.NOTEBOOK_DATABASE_ADD_NOTE_ERROR,
                                    notebookNode: notebookNode,
                                    error: "unable to get stat (" + path + "): " + error
                                });
                            }

                            FileAgent.createDirectory(path + "/assets", function(assetsPath, error) {
                                if (error) {
                                    return NotebookDispatcher.dispatch({
                                        actionType: NotebookConstants.NOTEBOOK_DATABASE_ADD_NOTE_ERROR,
                                        notebookNode: notebookNode,
                                        error: "unable to create assets directory: " + error
                                    });
                                }

                                NotebookDispatcher.dispatch({
                                    actionType: NotebookConstants.NOTEBOOK_DATABASE_ADD_NOTE_SUCCESS,
                                    note: {
                                        notebookNode: notebookNode,
                                        id: noteId,
                                        stat: stat,
                                        titleText: title,
                                        subtitleText: self.__getLastModifiedDate(stat),
                                        detailText: ""
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
     * @param note {Object} Note summary object to be copied
     */
    copyNote: function(note) {
        var self = this;
        var notebookNode = note.notebookNode;

        NotebookDispatcher.dispatch({
            actionType: NotebookConstants.NOTEBOOK_DATABASE_COPY_NOTE,
            srcNote: note
        });

        var notePath = this.__getPath(notebookNode.id + "/" + note.id);

        FileAgent.exist(notePath, function(path, exist, isDir, error) {
            if (error) {
                return NotebookDispatcher.dispatch({
                    actionType: NotebookConstants.NOTEBOOK_DATABASE_COPY_NOTE_ERROR,
                    srcNote: note,
                    error: "fs error: " + error
                });
            }

            if (exist) {
                var _copyNoteId = getTimecode();
                var _copyNotePath = dirname(notePath) + "/" + _copyNoteId;

                FileAgent.copy(notePath, _copyNotePath, function(srcPath, dstPath, error) {
                    if (error) {
                        return NotebookDispatcher.dispatch({
                            actionType: NotebookConstants.NOTEBOOK_DATABASE_COPY_NOTE_ERROR,
                            srcNote: note,
                            error: "unable to copy " + notePath + ": " + error
                        });
                    }

                    FileAgent.readFile(dstPath + "/" + DATABASE_NOTE_FILE, "utf8", function(path, data, error) {
                        if (error) {
                            return NotebookDispatcher.dispatch({
                                actionType: NotebookConstants.NOTEBOOK_DATABASE_COPY_NOTE_ERROR,
                                srcNote: note,
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
                                        actionType: NotebookConstants.NOTEBOOK_DATABASE_COPY_NOTE_ERROR,
                                        srcNote: note,
                                        error: "grep src error: " + error
                                    });
                                }

                                var _noteTitle = title[1];

                                var re = new RegExp(srcPath, "g");
                                data = data.replace(re, dstPath);

                                FileAgent.writeFile(dstPath + "/" + DATABASE_NOTE_FILE, data, function(path, progress, error) {
                                    if (error) {
                                        return NotebookDispatcher.dispatch({
                                            actionType: NotebookConstants.NOTEBOOK_DATABASE_COPY_NOTE_ERROR,
                                            srcNote: note,
                                            error: "unable to write " + path + ": " + error
                                        });
                                    }

                                    FileAgent.stat(dstPath, function(path, stat, error) {
                                        if (error) {
                                            return NotebookDispatcher.dispatch({
                                                actionType: NotebookConstants.NOTEBOOK_DATABASE_COPY_NOTE_ERROR,
                                                srcNote: note,
                                                error: "unable to get stat of " + path + ": " + error
                                            });
                                        }

                                        NotebookDispatcher.dispatch({
                                            actionType: NotebookConstants.NOTEBOOK_DATABASE_COPY_NOTE_SUCCESS,
                                            srcNote: note,
                                            note: {
                                                notebookNode: notebookNode,
                                                id: _copyNoteId,
                                                stat: stat,
                                                titleText: _noteTitle,
                                                subtitleText: self.__getLastModifiedDate(stat),
                                                detailText: ""
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
     * @param note {Object} Note summary object
     */
    trashNote: function(note) {
        var notePath = this.__getPath(note.notebookNode.id + "/" + note.id);

        NotebookDispatcher.dispatch({
            actionType: NotebookConstants.NOTEBOOK_DATABASE_TRASH_NOTE,
            note: note
        });

        FileAgent.exist(notePath, function(path, exist, isDir, error) {
            if (error) {
                return NotebookDispatcher.dispatch({
                    actionType: NotebookConstants.NOTEBOOK_DATABASE_TRASH_NOTE_ERROR,
                    note: note,
                    error: "fs error: " + error
                });
            }

            if (exist) {
                FileAgent.remove(notePath, function(path, error) {
                    if (error) {
                        return NotebookDispatcher.dispatch({
                            actionType: NotebookConstants.NOTEBOOK_DATABASE_TRASH_NOTE_ERROR,
                            note: note,
                            error: "unable to remove " + notePath + ": " + error
                        });
                    }

                    NotebookDispatcher.dispatch({
                        actionType: NotebookConstants.NOTEBOOK_DATABASE_TRASH_NOTE_SUCCESS,
                        note: note
                    });
                });
            }
        });
    }
}

module.exports = DatabaseActionCreators;
