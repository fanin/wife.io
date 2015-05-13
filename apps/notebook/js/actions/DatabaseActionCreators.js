var NotebookDispatcher = require('../dispatcher/NotebookDispatcher');
var NotebookConstants  = require('../constants/NotebookConstants');
var getTimecode        = require('utils/string-code').getTimecode;
var dirname            = require('utils/client-utils').dirname;
var base64ToBlob       = require('utils/buffer-utils').base64ToBlob;

var DATABASE_ROOT_FOLDER = "bookshelf";
var DATABASE_TREE_FILE   = "bookshelf-tree.json";
var DATABASE_NOTE_FILE   = "index.html";
var DATABASE_FIRST_ENTRY_LABEL = "All Notes";

var databaseStorage;
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
        if (!databaseStorage) return;

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
        if (!databaseStorage) return;

        NotebookDispatcher.dispatch({
            actionType: NotebookConstants.NOTEBOOK_DATABASE_CREATE_STACK,
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
                        NotebookId: parseInt(code),
                        NotebookName: name
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
     * @param notebookNode {Object} jqTree node of notebook to be selected
     */
    selectNotebook: function(notebookNode) {
        if (!databaseStorage) return;

        NotebookDispatcher.dispatch({
            actionType: NotebookConstants.NOTEBOOK_DATABASE_SELECT_NOTEBOOK,
            notebookNode: notebookNode
        });
    },

    /**
     * Load notes from notebook
     * @method loadNotes
     * @param notebookNode {Object} jqTree node of notebook to be loaded
     */
    loadNotes: function(notebookNode) {
        if (!databaseStorage) return;

        var __loadNotes = function(_this, node, cb) {
            var _noteDescriptors = [];
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

                            _noteDescriptors.push({
                                notebookNode: node,
                                noteId: noteId,
                                noteStat: stats[i],
                                noteTitle: data[1],
                                noteContent: ""
                            });

                            if (i === ids.length - 1)
                                cb(_noteDescriptors);
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
            var _noteMergedDescriptors = [];
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

                __loadNotes(this, child, function(noteDescriptors) {
                    _noteMergedDescriptors = _noteMergedDescriptors.concat(noteDescriptors);
                    if (++_count === _total) {
                        NotebookDispatcher.dispatch({
                            actionType: NotebookConstants.NOTEBOOK_DATABASE_LOADNOTES_SUCCESS,
                            notebookNode: notebookNode,
                            noteDescriptors: _noteMergedDescriptors
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
                __loadNotes(this, child, function(noteDescriptors) {
                    _stackNotes = _stackNotes.concat(noteDescriptors);
                    if (++_count === notebookNode.children.length) {
                        NotebookDispatcher.dispatch({
                            actionType: NotebookConstants.NOTEBOOK_DATABASE_LOADNOTES_SUCCESS,
                            notebookNode: notebookNode,
                            noteDescriptors: _stackNotes
                        });
                    }
                });
                return true;
            }.bind(this));
        }
        else {
            __loadNotes(this, notebookNode, function(noteDescriptors) {
                NotebookDispatcher.dispatch({
                    actionType: NotebookConstants.NOTEBOOK_DATABASE_LOADNOTES_SUCCESS,
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
        if (!databaseStorage) return;

        NotebookDispatcher.dispatch({
            actionType: NotebookConstants.NOTEBOOK_DATABASE_SET_NOTE_SORT_METHOD,
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

                                /**
                                 * @define NoteDescriptor
                                 * @member notebookNode {Object} Notebook node object
                                 * @member noteId       {Number} Note ID
                                 * @member noteStat     {Object} Note file state information
                                 * @member noteTitle    {String} Note list item title text
                                 * @member noteContent  {String} Note content in HTML format
                                 */
                                NotebookDispatcher.dispatch({
                                    actionType: NotebookConstants.NOTEBOOK_DATABASE_ADD_NOTE_SUCCESS,
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
        var notebookNode = noteDescriptor.notebookNode;

        NotebookDispatcher.dispatch({
            actionType: NotebookConstants.NOTEBOOK_DATABASE_COPY_NOTE,
            srcNoteDescriptor: noteDescriptor
        });

        var notePath = this.__getPath(notebookNode.id + "/" + noteDescriptor.noteId);

        FileAgent.exist(notePath, function(path, exist, isDir, error) {
            if (error) {
                return NotebookDispatcher.dispatch({
                    actionType: NotebookConstants.NOTEBOOK_DATABASE_COPY_NOTE_ERROR,
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
                            actionType: NotebookConstants.NOTEBOOK_DATABASE_COPY_NOTE_ERROR,
                            srcNoteDescriptor: noteDescriptor,
                            error: "unable to copy " + notePath + ": " + error
                        });
                    }

                    FileAgent.readFile(dstPath + "/" + DATABASE_NOTE_FILE, "utf8", function(path, data, error) {
                        if (error) {
                            return NotebookDispatcher.dispatch({
                                actionType: NotebookConstants.NOTEBOOK_DATABASE_COPY_NOTE_ERROR,
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
                                        actionType: NotebookConstants.NOTEBOOK_DATABASE_COPY_NOTE_ERROR,
                                        srcNoteDescriptor: noteDescriptor,
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
                                            srcNoteDescriptor: noteDescriptor,
                                            error: "unable to write " + path + ": " + error
                                        });
                                    }

                                    FileAgent.stat(dstPath, function(path, stat, error) {
                                        if (error) {
                                            return NotebookDispatcher.dispatch({
                                                actionType: NotebookConstants.NOTEBOOK_DATABASE_COPY_NOTE_ERROR,
                                                srcNote: noteDescriptor,
                                                error: "unable to get stat of " + path + ": " + error
                                            });
                                        }

                                        NotebookDispatcher.dispatch({
                                            actionType: NotebookConstants.NOTEBOOK_DATABASE_COPY_NOTE_SUCCESS,
                                            srcNoteDescriptor: noteDescriptor,
                                            dstNoteDescriptor: {
                                                notebookNode: notebookNode,
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

        var notePath = this.__getPath(noteDescriptor.notebookNode.id + "/" + noteDescriptor.noteId);

        NotebookDispatcher.dispatch({
            actionType: NotebookConstants.NOTEBOOK_DATABASE_TRASH_NOTE,
            noteDescriptor: noteDescriptor
        });

        FileAgent.exist(notePath, function(path, exist, isDir, error) {
            if (error) {
                return NotebookDispatcher.dispatch({
                    actionType: NotebookConstants.NOTEBOOK_DATABASE_TRASH_NOTE_ERROR,
                    noteDescriptor: noteDescriptor,
                    error: "fs error: " + error
                });
            }

            if (exist) {
                FileAgent.remove(notePath, function(path, error) {
                    if (error) {
                        return NotebookDispatcher.dispatch({
                            actionType: NotebookConstants.NOTEBOOK_DATABASE_TRASH_NOTE_ERROR,
                            noteDescriptor: noteDescriptor,
                            error: "unable to remove " + notePath + ": " + error
                        });
                    }

                    NotebookDispatcher.dispatch({
                        actionType: NotebookConstants.NOTEBOOK_DATABASE_TRASH_NOTE_SUCCESS,
                        noteDescriptor: noteDescriptor
                    });
                });
            }
        });
    },

    /**
     * Load note content
     * @method loadNoteContent
     * @param noteDescriptor {Object} NoteDescriptor object of note to be loaded
     */
    loadNoteContent: function(noteDescriptor) {
        if (!databaseStorage) return;

        function __replaceQueryString(url, param, value) {
            var re = new RegExp("([?|&])" + param + "=.*?(&|$|\")","ig");
            if (url.match(re))
                return url.replace(re,'$1' + param + "=" + value + '$2');
            else
                return url;
        }

        var notePath = this.__getPath(noteDescriptor.notebookNode.id + "/" + noteDescriptor.noteId);

        NotebookDispatcher.dispatch({
            actionType: NotebookConstants.NOTEBOOK_DATABASE_LOAD_NOTE_CONTENT,
            noteDescriptor: noteDescriptor
        });

        FileAgent.readFile(notePath + "/" + DATABASE_NOTE_FILE, "utf8", function(path, data, error) {
            if (error) {
                return NotebookDispatcher.dispatch({
                    actionType: NotebookConstants.NOTEBOOK_DATABASE_LOAD_NOTE_CONTENT_ERROR,
                    noteDescriptor: noteDescriptor,
                    error: "unable to read " + path + ": " + error
                });
            }

            /* Remove all single &nbsp between tags, and extract contents inside <body></body> */
            var content = data.replace(/\>&nbsp;\</gi,'\>\<')
                              .match(/\<body[^>]*\>([^]*)\<\/body/m)[1] || "";
            noteDescriptor.noteContent = __replaceQueryString(content, "uuid", databaseStorage.uuid);

            NotebookDispatcher.dispatch({
                actionType: NotebookConstants.NOTEBOOK_DATABASE_LOAD_NOTE_CONTENT_SUCCESS,
                noteDescriptor: noteDescriptor
            });
        });
    },

    /**
     * Save note content
     * @mehotd saveNoteContent
     * @param noteDescriptor {Object} NoteDescriptor object of note to be saved
     * @param title {String} Note title
     * @param content {String} Note content
     * @param onWriteSummary {Function} Callback function for adding summaries
     * @param onSave {Function} Callback function after note is saved
     */
    saveNoteContent: function(noteDescriptor, title, content, onWriteSummary, onSave) {
        if (!databaseStorage) return;

        var notePath = this.__getPath(noteDescriptor.notebookNode.id + "/" + noteDescriptor.noteId);

        NotebookDispatcher.dispatch({
            actionType: NotebookConstants.NOTEBOOK_DATABASE_SAVE_NOTE_CONTENT,
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
                    var _fileName = (parseInt(_imgName) + i).toString() + (_ext ? "." + _ext : "");

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
                        FileAgent.saveUrlAs(notePath + "/assets/" + _fileName, _src, function(path, error) {
                            if (error) {
                                // TODO: embed error message in content
                                console.log("Unable to save file from URL " + _src);
                            }
                            else
                                content = content.replace(
                                    new RegExp(_src, 'g'),
                                    "userdata/" + path + (databaseStorage.uuid ? "?uuid=" + databaseStorage.uuid : "")
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
         * Write note summary to summary.json
         * 1) Add basic info into summary (i.e: title)
         * 2) Call onWriteSummary to get further summary data
         * 4) Write summary to summary.json
         */
        function __updateNoteSummary(title, content, cb) {
            var summary = { title: title };

            if (onWriteSummary)
                summary = onWriteSummary(summary);

            FileAgent.writeFile(notePath + "/summary.json", JSON.stringify(summary), function(path, progress, error) {
                cb && cb("unable to update " + path + ": " + error);
            });
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

            FileAgent.writeFile(notePath  + "/" + DATABASE_NOTE_FILE, _doc, function(path, progress, error) {
                if (error)
                    return (cb && cb("unable to write " + path + ": " + error));

                /* Update summary.json */
                __updateNoteSummary(title, content, function(error) {
                    if (error)
                        return (cb && cb(error));

                    /* Update last modified time */
                    FileAgent.touch(notePath, function(path, error) {
                        if (error)
                            return (cb && cb("unable to touch " + path + ": " + error));

                        noteDescriptor.title = title;
                        noteDescriptor.content = content;

                        onSave && onSave();

                        return (cb && cb());
                    });
                });
            });
        }

        __grabResources(content, function(grabbedContent) {
            __save(title, grabbedContent, function(error) {
                if (error)
                    return NotebookDispatcher.dispatch({
                        actionType: NotebookConstants.NOTEBOOK_DATABASE_SAVE_NOTE_CONTENT_ERROR,
                        noteDescriptor: noteDescriptor,
                        error: error
                    });

                NotebookDispatcher.dispatch({
                    actionType: NotebookConstants.NOTEBOOK_DATABASE_SAVE_NOTE_CONTENT_SUCCESS,
                    noteDescriptor: noteDescriptor
                });
            });
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

        var notePath = this.__getPath(noteDescriptor.notebookNode.id + "/" + noteDescriptor.noteId);

        function __removeUseless(items, i, cb) {
            FileAgent.grep(notePath  + "/" + DATABASE_NOTE_FILE, items[i], null, function(path, data, error) {
                if (error)
                    return (cb && cb("unable to read " + path + ": " + error));

                if (!data) {
                    FileAgent.remove(notePath + "/assets/" + items[i], function(path, error) {
                        if (error)
                            return (cb && cb("unable to remove " + path + ": " + error));

                        //console.log("Unused asset '" + items[i] + "' removed");
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
                actionType: NotebookConstants.NOTEBOOK_DATABASE_CLEAR_USELESS_NOTE_ASSETS,
                noteDescriptor: noteDescriptor
            });

            FileAgent.list(notePath + "/assets", function(path, items, error) {
                if (error)
                    return NotebookDispatcher.dispatch({
                        actionType: NotebookConstants.NOTEBOOK_DATABASE_CLEAR_USELESS_NOTE_ASSETS_ERROR,
                        noteDescriptor: noteDescriptor,
                        error: "unable to list " + path + ": " + error
                    });

                if (items.length > 0)
                    __removeUseless(items, 0, function(error) {
                        if (error)
                            NotebookDispatcher.dispatch({
                                actionType: NotebookConstants.NOTEBOOK_DATABASE_CLEAR_USELESS_NOTE_ASSETS_ERROR,
                                noteDescriptor: noteDescriptor,
                                error: error
                            });
                        else
                            NotebookDispatcher.dispatch({
                                actionType: NotebookConstants.NOTEBOOK_DATABASE_CLEAR_USELESS_NOTE_ASSETS_SUCCESS,
                                noteDescriptor: noteDescriptor
                            });
                    });
                else
                    NotebookDispatcher.dispatch({
                        actionType: NotebookConstants.NOTEBOOK_DATABASE_CLEAR_USELESS_NOTE_ASSETS_SUCCESS,
                        noteDescriptor: noteDescriptor
                    });
            });
        }, afterDelay);
    },

    /**
     * Take note snapshot
     * @method takeNoteSnapshot
     * @param noteDescriptor {Object} NoteDescriptor object of note to be taking snapshot
     * @param snapshotDOMContainer {Object} jQuery object of note snapshot container
     */
    takeNoteSnapshot: function(noteDescriptor, snapshotDOMContainer) {
        if (!databaseStorage) return;

        require("../../lib/html2canvas/html2canvas.js");

        NotebookDispatcher.dispatch({
            actionType: NotebookConstants.NOTEBOOK_DATABASE_TAKE_NOTE_SNAPSHOT,
            noteDescriptor: noteDescriptor
        });

        try {
            html2canvas(snapshotDOMContainer, {
                allowTaint: false,
                taintTest: false,
                onrendered: function(canvas) {
                    var dataUrl = canvas.toDataURL("image/png");
                    var data = dataUrl.replace(/^data:image\/png;base64,/, "");

                    FileAgent.writeFile(saveTo, base64ToBlob(data), function(path, progress, error) {
                        if (error)
                            NotebookDispatcher.dispatch({
                                actionType: NotebookConstants.NOTEBOOK_DATABASE_TAKE_NOTE_SNAPSHOT_ERROR,
                                noteDescriptor: noteDescriptor,
                                error: "unable to write snapshot to " + path + ": " + error
                            });
                        else
                            NotebookDispatcher.dispatch({
                                actionType: NotebookConstants.NOTEBOOK_DATABASE_TAKE_NOTE_SNAPSHOT_SUCCESS,
                                noteDescriptor: noteDescriptor
                            });
                    });
                }
            });
        }
        catch (error) {
            NotebookDispatcher.dispatch({
                actionType: NotebookConstants.NOTEBOOK_DATABASE_TAKE_NOTE_SNAPSHOT_ERROR,
                noteDescriptor: noteDescriptor,
                error: "html2canvas error: " + error
            });
        }
    }
}

module.exports = DatabaseActionCreators;
