var StringCode         = require('utils/string-code');
var NotebookDispatcher = require('../dispatcher/NotebookDispatcher');
var NotebookConstants  = require('../constants/NotebookConstants');

var DATABASE_ROOT_FOLDER = "bookshelf";
var DATABASE_TREE_FILE   = "bookshelf-tree.json";
var DATABASE_FIRST_ENTRY_LABEL = "All Notes";

var saveWaitTimer;

var DatabaseActionCreators = {

    /**
     * Build real path from node or string
     * @param {object/string} jqTree node object or relative path string
     */
    __getPath: function(path) {
        path = path || "";
        return DATABASE_ROOT_FOLDER + path;
    },

    loadTree: function() {
        var treeData = [{ label: DATABASE_FIRST_ENTRY_LABEL, id: 1 }];

        NotebookDispatcher.dispatch({
            actionType: NotebookConstants.NOTEBOOK_APP_DATABASE_LOADTREE
        });

        /* Create /bookshelf if necessary */
        DiligentAgent.getClient().fileManager.exist(this.__getPath(), function(path, exist, isDir, error) {
            if (error) {
                NotebookDispatcher.dispatch({
                    actionType: NotebookConstants.NOTEBOOK_APP_DATABASE_LOADTREE_ERROR,
                    error: "fs error: " + error
                });

                return;
            }

            if (!exist) {
                DiligentAgent.getClient().fileManager.createDirectory(
                    this.__getPath(),
                    function(path, error) {
                        if (error) {
                            NotebookDispatcher.dispatch({
                                actionType: NotebookConstants.NOTEBOOK_APP_DATABASE_LOADTREE_ERROR,
                                error: "unable to create " + path + ", error: " + error
                            });
                        }
                    }
                );
            }
            else if (exist && !isDir) {
                DiligentAgent.getClient().fileManager.remove(this.__getPath(), function(path, error) {
                    if (error) {
                        NotebookDispatcher.dispatch({
                            actionType: NotebookConstants.NOTEBOOK_APP_DATABASE_LOADTREE_ERROR,
                            error: "unable to remove " + path + ", error: " + error
                        });
                    }

                    DiligentAgent.getClient().fileManager.createDirectory(
                        this.__getPath(),
                        function(path, error) {
                            if (error) {
                                NotebookDispatcher.dispatch({
                                    actionType: NotebookConstants.NOTEBOOK_APP_DATABASE_LOADTREE_ERROR,
                                    error: "unable to create " + path + ", error: " + error
                                });
                            }
                        }
                    );
                });
            }
        }.bind(this));

        /* Load notebook tree data from bookshelf-tree.json */
        DiligentAgent.getClient().fileManager.exist(DATABASE_TREE_FILE, function(path, exist, isDir, error) {
            if (error) {
                NotebookDispatcher.dispatch({
                    actionType: NotebookConstants.NOTEBOOK_APP_DATABASE_LOADTREE_ERROR,
                    error: "fs error: " + error
                });

                return;
            }

            if (exist) {
                DiligentAgent.getClient().fileManager.readFile(
                    DATABASE_TREE_FILE,
                    "utf8",
                    function(path, data, error) {
                        if (error) {
                            NotebookDispatcher.dispatch({
                                actionType: NotebookConstants.NOTEBOOK_APP_DATABASE_LOADTREE_ERROR,
                                error: "unable to read tree data: " + error
                            });
                        }
                        else {
                            try {
                                treeData = JSON.parse(data);

                                NotebookDispatcher.dispatch({
                                    actionType: NotebookConstants.NOTEBOOK_APP_DATABASE_LOADTREE_SUCCESS,
                                    treeData: treeData
                                });
                            }
                            catch (error) {
                                NotebookDispatcher.dispatch({
                                    actionType: NotebookConstants.NOTEBOOK_APP_DATABASE_LOADTREE_ERROR,
                                    error: "parse tree data error: " + error + "\ndata:\n" + data
                                });
                            }
                        }
                    }
                );
            }
            else {
                DiligentAgent.getClient().fileManager.writeFile(
                    DATABASE_TREE_FILE,
                    JSON.stringify(treeData),
                    function(path, progress, error) {
                        if (error) {
                            NotebookDispatcher.dispatch({
                                actionType: NotebookConstants.NOTEBOOK_APP_DATABASE_LOADTREE_ERROR,
                                error: "unable to write tree data: " + error
                            });
                        }
                        else {
                            NotebookDispatcher.dispatch({
                                actionType: NotebookConstants.NOTEBOOK_APP_DATABASE_LOADTREE_SUCCESS,
                                treeData: treeData
                            });
                        }
                    }
                );
            }
        });
    },

    saveTree: function(treeData, wait) {
        wait = wait || 0;

        if (saveWaitTimer) {
            clearTimeout(saveWaitTimer);
        }

        saveWaitTimer = setTimeout(function() {
            saveWaitTimer = undefined;

            NotebookDispatcher.dispatch({
                actionType: NotebookConstants.NOTEBOOK_APP_DATABASE_SAVETREE
            });

            DiligentAgent.getClient().fileManager.writeFile(
                DATABASE_TREE_FILE,
                treeData,
                function(path, progress, error) {
                    if (error) {
                        NotebookDispatcher.dispatch({
                            actionType: NotebookConstants.NOTEBOOK_APP_DATABASE_SAVETREE_ERROR,
                            error: "unable to write tree data: " + error
                        });
                    }
                    else {
                        NotebookDispatcher.dispatch({
                            actionType: NotebookConstants.NOTEBOOK_APP_DATABASE_SAVETREE_SUCCESS,
                            treeData: treeData
                        });
                    }
                }
            );
        }, wait);
    },

    createStack: function(name) {
        NotebookDispatcher.dispatch({
            actionType: NotebookConstants.NOTEBOOK_APP_DATABASE_CREATE_STACK,
            id: parseInt(StringCode.getTimecode()),
            name: name
        });
    },

    createNotebook: function(name) {
        var code = StringCode.getTimecode();
        var notebookPath = this.__getPath("/" + code);

        NotebookDispatcher.dispatch({
            actionType: NotebookConstants.NOTEBOOK_APP_DATABASE_CREATE_NOTEBOOK
        });

        DiligentAgent.getClient().fileManager.exist(notebookPath, function(path, exist, isDir, error) {
            if (error) {
                NotebookDispatcher.dispatch({
                    actionType: NotebookConstants.NOTEBOOK_APP_DATABASE_CREATE_NOTEBOOK_ERROR,
                    error: "fs operation error: " + error
                });

                return;
            }

            if (exist) {
                NotebookDispatcher.dispatch({
                    actionType: NotebookConstants.NOTEBOOK_APP_DATABASE_CREATE_NOTEBOOK_ERROR,
                    error: "given path is already exist"
                });

                return;
            }

            DiligentAgent.getClient().fileManager.createDirectory(notebookPath, function(path, error) {
                if (error) {
                    NotebookDispatcher.dispatch({
                        actionType: NotebookConstants.NOTEBOOK_APP_DATABASE_CREATE_NOTEBOOK_ERROR,
                        error: "unable to create " + path + ", error: " + error
                    });
                }
                else {
                    NotebookDispatcher.dispatch({
                        actionType: NotebookConstants.NOTEBOOK_APP_DATABASE_CREATE_NOTEBOOK_SUCCESS,
                        id: parseInt(code),
                        name: name
                    });
                }
            });
        });
    },

    trashNotebook: function(notebookId) {
        var notebookPath = this.__getPath("/" + notebookId);

        NotebookDispatcher.dispatch({
            actionType: NotebookConstants.NOTEBOOK_APP_DATABASE_TRASH_NOTEBOOK,
            id: notebookId
        });

        DiligentAgent.getClient().fileManager.exist(notebookPath, function(path, exist, isDir, error) {
            if (error) {
                NotebookDispatcher.dispatch({
                    actionType: NotebookConstants.NOTEBOOK_APP_DATABASE_TRASH_NOTEBOOK_ERROR,
                    error: "fs error: " + error
                });

                return;
            }

            if (!exist) {
                NotebookDispatcher.dispatch({
                    actionType: NotebookConstants.NOTEBOOK_APP_DATABASE_TRASH_NOTEBOOK_ERROR,
                    error: "notebook (id = " + notebookId + ") not found"
                });

                return;
            }

            DiligentAgent.getClient().fileManager.remove(notebookPath, function(path, error) {
                if (error) {
                    NotebookDispatcher.dispatch({
                        actionType: NotebookConstants.NOTEBOOK_APP_DATABASE_TRASH_NOTEBOOK_ERROR,
                        error: "unable to remove notebook (id = " + notebookId + ") : " + error
                    });
                }

                NotebookDispatcher.dispatch({
                    actionType: NotebookConstants.NOTEBOOK_APP_DATABASE_TRASH_NOTEBOOK_SUCCESS,
                    id: notebookId
                });
            });
        });
    },

    selectNotebook: function(notebookId) {
        NotebookDispatcher.dispatch({
            actionType: NotebookConstants.NOTEBOOK_APP_DATABASE_SELECT,
            id: notebookId
        });
    }
}

module.exports = DatabaseActionCreators;
