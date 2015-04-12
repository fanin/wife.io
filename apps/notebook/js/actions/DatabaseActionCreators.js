var NotebookDispatcher = require('../dispatcher/NotebookDispatcher');
var NotebookConstants = require('../constants/NotebookConstants');

var DATABASE_ROOT_FOLDER = "bookshelf";
var DATABASE_TREE_FILE = "bookshelf-tree.json";

var DatabaseActionCreators = {

    /**
     * Build real path from node or string
     * @param {object/string} jqTree node object or relative path string
     */
    getPath: function(node) {
        var path = "";

        if (typeof node === "object")
            path = "/" + node.id;
        else if (typeof node === "string")
            path = node;

        return DATABASE_ROOT_FOLDER + path;
    },

    loadTree: function() {
        var treeData = [{ name: "All Notes" }];

        NotebookDispatcher.dispatch({
            actionType: NotebookConstants.NOTEBOOK_APP_DATABASE_LOADTREE
        });

        /* Create /bookshelf if necessary */
        DiligentAgent.getClient().fileManager.exist(this.getPath(), function(path, exist, isDir, error) {
            if (error) {
                NotebookDispatcher.dispatch({
                    actionType: NotebookConstants.NOTEBOOK_APP_DATABASE_LOADTREE_ERROR,
                    error: "fs error: " + error
                });

                return;
            }

            if (!exist) {
                DiligentAgent.getClient().fileManager.createDirectory(this.getPath(), function(path, error) {
                    if (error) {
                        NotebookDispatcher.dispatch({
                            actionType: NotebookConstants.NOTEBOOK_APP_DATABASE_LOADTREE_ERROR,
                            error: "unable to create /bookshelf: " + error
                        });
                    }
                });
            }
            else if (exist && !isDir) {
                DiligentAgent.getClient().fileManager.remove(this.getPath(), function(path, error) {
                    if (error) {
                        NotebookDispatcher.dispatch({
                            actionType: NotebookConstants.NOTEBOOK_APP_DATABASE_LOADTREE_ERROR,
                            error: "unable to remove bad /bookshelf: " + error
                        });
                    }

                    DiligentAgent.getClient().fileManager.createDirectory(this.getPath(), function(path, error) {
                        if (error) {
                            NotebookDispatcher.dispatch({
                                actionType: NotebookConstants.NOTEBOOK_APP_DATABASE_LOADTREE_ERROR,
                                error: "unable to create /bookshelf: " + error
                            });
                        }
                    });
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
                DiligentAgent.getClient().fileManager.readFile(DATABASE_TREE_FILE, "utf8", function(path, data, error) {
                    if (error) {
                        NotebookDispatcher.dispatch({
                            actionType: NotebookConstants.NOTEBOOK_APP_DATABASE_LOADTREE_ERROR,
                            error: "unable to read bookshelf tree data: " + error
                        });
                    }

                    try {
                        treeData = JSON.parse(data);
                    }
                    catch (error) {
                        NotebookDispatcher.dispatch({
                            actionType: NotebookConstants.NOTEBOOK_APP_DATABASE_LOADTREE_ERROR,
                            error: "parse tree data error: " + error + "\ndata:\n" + data
                        });
                    }

                    NotebookDispatcher.dispatch({
                        actionType: NotebookConstants.NOTEBOOK_APP_DATABASE_LOADTREE_SUCCESS,
                        treeData: treeData
                    });
                });
            }
            else {
                DiligentAgent.getClient().fileManager.writeFile(DATABASE_TREE_FILE, JSON.stringify(treeData), function(path, progress, error) {
                    if (error) {
                        NotebookDispatcher.dispatch({
                            actionType: NotebookConstants.NOTEBOOK_APP_DATABASE_LOADTREE_ERROR,
                            error: "unable to write bookshelf tree data: " + error
                        });
                    }

                    NotebookDispatcher.dispatch({
                        actionType: NotebookConstants.NOTEBOOK_APP_DATABASE_LOADTREE_SUCCESS,
                        treeData: treeData
                    });
                });
            }
        });
    }
}

module.exports = DatabaseActionCreators;
