import NotebookDispatcher from '../dispatcher/NotebookDispatcher';
import NotebookConstants from '../constants/NotebookConstants';
import NotebookActionConstants from '../constants/NotebookActionConstants';
import FSAPI from 'lib/api/FSAPI';
import { timestamp } from 'lib/utils/common/string-misc';
import { base64ToBlob } from 'lib/utils/buffer';
import assign from 'object-assign';
import async from 'async';

var databaseStorage;
var saveWaitTimer;

let dirname = function(path) {
  return path.replace(/\\/g, '/').replace(/\/[^\/]*\/?$/, '');
}

/**
 * Get bookshelf path inside app userdata folder
 * @method getBookshelfPath
 * @param path {String} Relative path string
 * @return {String} Bookshelf path inside app userdata folder
 * @private
 */
let getBookshelfPath = function(path = '') {
  return NotebookConstants.DATABASE_ROOT_FOLDER + '/' + path;
}

/**
 * Get path of note on the bookshelf
 * @method getNotePath
 * @param noteDescriptor {Object} Note descriptor
 * @return {String} Path of given note
 * @private
 */
let getNotePath = function(noteDescriptor) {
  return getBookshelfPath(
    noteDescriptor.notebookNode.id + '/' + noteDescriptor.id
  );
}

/**
 * Get path of note asset
 * @method getNoteAssetPath
 * @param noteDescriptor {Object} Note descriptor
 * @param assetName {String} Note asset file name
 * @return {String} Path of note asset
 * @private
 */
let getNoteAssetPath = function(noteDescriptor, assetName) {
  return getNotePath(noteDescriptor) + '/assets/' + assetName;
}

/**
 * Build path with disk uuid for FSAPI
 * @method buildApiPath
 * @param path {String} Path string
 * @return {String} FSAPI path string
 * @private
 */
let buildApiPath = function(path) {
  return databaseStorage ? path + ":" + databaseStorage.uuid : path;
}

export default {

  /**
   * Open notebook database on given storage
   * @method openDatabase
   * @param storage {Object} Storage object where database is stored
   */
  openDatabase: (storage) => {
    databaseStorage = storage;
    NotebookDispatcher.dispatch({
      actionType: NotebookActionConstants.NOTEBOOK_DATABASE_OPEN,
      storage: storage
    });
  },

  /**
   * Close notebook database
   * @method closeDatabase
   */
  closeDatabase: () => {
    databaseStorage = null;
    NotebookDispatcher.dispatch({
      actionType: NotebookActionConstants.NOTEBOOK_DATABASE_CLOSE
    });
  },

  /**
   * Load notebook tree from database
   * @method loadTree
   */
  loadTree: () => {
    if (!databaseStorage) return;

    var bookshelfPath = getBookshelfPath();
    var bookshelfApiPath = buildApiPath(bookshelfPath);
    var bookshelfTreeApiPath = buildApiPath(NotebookConstants.DATABASE_TREE_FILE);
    var initialTreeData = [{
      label: NotebookConstants.DATABASE_NOTEBOOK_ALL_LABEL,
      id: NotebookConstants.DATABASE_NOTEBOOK_ALL_ID
    }];

    NotebookDispatcher.dispatch({
      actionType: NotebookActionConstants.NOTEBOOK_DATABASE_LOADTREE
    });

    /* Create /bookshelf if necessary */
    FSAPI.exist(bookshelfApiPath)
    .then(function(result) {
      if (result.exist)
        return FSAPI.stat(bookshelfApiPath);
      else
        return FSAPI.createDirectory(bookshelfApiPath);
    })
    .then(function(result) {
      if (result.api === 'fs.stat')
        if (!result.stat.isDirectory)
          return FSAPI.removeFile(bookshelfApiPath);
      return result;
    })
    .then(function(result) {
      if (result.api === 'fs.removeFile')
        return FSAPI.createDirectory(bookshelfApiPath);
      else
        return result;
    })
    .then(function(result) {
      return FSAPI.exist(bookshelfTreeApiPath);
    })
    .then(function(result) {
      if (result.exist)
        return FSAPI.readFile(bookshelfTreeApiPath, { encoding: 'utf8' });
      else
        return FSAPI.writeFile(bookshelfTreeApiPath, JSON.stringify(initialTreeData));
    })
    .then(function(result) {
      if (result.api === 'fs.readFile') {
        let treeData;

        try {
          treeData = JSON.parse(result.data);
        }
        catch (error) {
          NotebookDispatcher.dispatch({
            actionType: NotebookActionConstants.NOTEBOOK_DATABASE_LOADTREE_ERROR,
            error: "parse tree data error: " + error.message + "\ndata:\n" + result.data
          });
        }
        finally {
          NotebookDispatcher.dispatch({
            actionType: NotebookActionConstants.NOTEBOOK_DATABASE_LOADTREE_SUCCESS,
            treeData: treeData
          });
        }
      }
      else if (result.api === 'fs.writeFile')
        NotebookDispatcher.dispatch({
          actionType: NotebookActionConstants.NOTEBOOK_DATABASE_LOADTREE_SUCCESS,
          treeData: initialTreeData
        });
    })
    .catch(function(error) {
      if (error.api === 'fs.createDirectory')
        NotebookDispatcher.dispatch({
          actionType: NotebookActionConstants.NOTEBOOK_DATABASE_LOADTREE_ERROR,
          error: "unable to create " + bookshelfPath + ", error: " + error.message
        });
      else if (error.api === 'fs.removeFile')
        NotebookDispatcher.dispatch({
          actionType: NotebookActionConstants.NOTEBOOK_DATABASE_LOADTREE_ERROR,
          error: "unable to remove " + bookshelfPath + ", error: " + error.message
        });
      else if (error.api === 'fs.readFile')
        NotebookDispatcher.dispatch({
          actionType: NotebookActionConstants.NOTEBOOK_DATABASE_LOADTREE_ERROR,
          error: "unable to read tree data: " + error.message
        });
      else if (error.api === 'fs.writeFile')
        NotebookDispatcher.dispatch({
          actionType: NotebookActionConstants.NOTEBOOK_DATABASE_LOADTREE_ERROR,
          error: "unable to write tree data: " + error.message
        });
      else
        NotebookDispatcher.dispatch({
          actionType: NotebookActionConstants.NOTEBOOK_DATABASE_LOADTREE_ERROR,
          error: "unknown api call error: " + error.message
        });
    });
  },

  /**
   * Save notebook tree to database
   * @method saveTree
   * @param treeJsonData {String} jqTree tree data JSON string
   * @param wait {Number} Wait a period of time in millisecond before saving tree data
   */
  saveTree: (treeJsonData, wait = 0) => {
    var self = this;
    var treeData;

    if (!databaseStorage) return;

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
          error: "parse tree data error: " + error.message + "\ndata:\n" + treeJsonData
        });
      }
      finally {
        FSAPI.writeFile(buildApiPath(NotebookConstants.DATABASE_TREE_FILE), treeJsonData, {
          onSuccess: function() {
            NotebookDispatcher.dispatch({
              actionType: NotebookActionConstants.NOTEBOOK_DATABASE_SAVETREE_SUCCESS,
              treeData: treeData
            });
          },
          onError: function(error) {
            NotebookDispatcher.dispatch({
              actionType: NotebookActionConstants.NOTEBOOK_DATABASE_SAVETREE_ERROR,
              error: "unable to write tree data: " + error.message
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
  createStack: (name) => {
    if (!databaseStorage) return;

    NotebookDispatcher.dispatch({
      actionType: NotebookActionConstants.NOTEBOOK_DATABASE_CREATE_STACK,
      id: parseInt(timestamp()),
      name: name
    });
  },

  /**
   * Create a empty notebook in database
   * @method createNotebook
   * @param name {String} Notebook name
   */
  createNotebook: (name) => {
    if (!databaseStorage) return;

    var code = timestamp();
    var notebookPath = getBookshelfPath(code);

    NotebookDispatcher.dispatch({
      actionType: NotebookActionConstants.NOTEBOOK_DATABASE_CREATE_NOTEBOOK
    });

    FSAPI.exist(buildApiPath(notebookPath), {
      onSuccess: function(exist) {
        if (exist) {
          return NotebookDispatcher.dispatch({
            actionType: NotebookActionConstants.NOTEBOOK_DATABASE_CREATE_NOTEBOOK_ERROR,
            error: "given path is already exist"
          });
        }

        FSAPI.createDirectory(buildApiPath(notebookPath), {
          onSuccess: function() {
            NotebookDispatcher.dispatch({
              actionType: NotebookActionConstants.NOTEBOOK_DATABASE_CREATE_NOTEBOOK_SUCCESS,
              notebookId: parseInt(code),
              notebookName: name
            });
          },
          onError: function(error) {
            NotebookDispatcher.dispatch({
              actionType: NotebookActionConstants.NOTEBOOK_DATABASE_CREATE_NOTEBOOK_ERROR,
              error: "unable to create " + notebookPath + ", error: " + error.message
            });
          }
        });
      }.bind(this)
    });
  },

  /**
   * Remove a notebook from database
   * @method trashNotebook
   * @param notebookNode {Object} jqTree node of notebook to be removed
   */
  trashNotebook: (notebookNode) => {
    if (!databaseStorage) return;

    var notebookPath = getBookshelfPath(notebookNode.id);

    NotebookDispatcher.dispatch({
      actionType: NotebookActionConstants.NOTEBOOK_DATABASE_TRASH_NOTEBOOK,
      notebookNode: notebookNode
    });

    FSAPI.exist(buildApiPath(notebookPath), {
      onSuccess: function(exist) {
        if (!exist) {
          return NotebookDispatcher.dispatch({
            actionType: NotebookActionConstants.NOTEBOOK_DATABASE_TRASH_NOTEBOOK_ERROR,
            error: "notebook (id = " + notebookNode.id + ") not found"
          });
        }

        FSAPI.removeFile(buildApiPath(notebookPath), {
          onSuccess: function() {
            NotebookDispatcher.dispatch({
              actionType: NotebookActionConstants.NOTEBOOK_DATABASE_TRASH_NOTEBOOK_SUCCESS,
              notebookNode: notebookNode
            });
          },
          onError: function(error) {
            NotebookDispatcher.dispatch({
              actionType: NotebookActionConstants.NOTEBOOK_DATABASE_TRASH_NOTEBOOK_ERROR,
              error: "unable to remove notebook (id = " + notebookNode.id + ") : " + error.message
            });
          }
        });
      }.bind(this)
    });
  },

  /**
   * Select a notebook
   * @method selectNotebook
   * @param notebookNode {Object} jqTree node of notebook to be selected
   */
  selectNotebook: (notebookNode) => {
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
  loadNotes: (notebookNode, searchString) => {
    if (!databaseStorage) return;

    var self = this;
    var __loadNotes = function(node, cb) {
      var _noteDescriptors = [];
      var _notebookPath = getBookshelfPath(node.id);

      FSAPI.list(buildApiPath(_notebookPath), {
        getStat: true,
        onSuccess: function(ids, stats) {
          stats = stats.filter(function(stat, i) {
            if (!stat.isDirectory) {
              ids.splice(i, 1);
              return false;
            }
            else
              return true;
          });

          if (ids.length === 0) {
            return cb([]);
          }

          (function __iterateIds(i) {
            var noteId = ids[i];
            var _noteIndexPath = _notebookPath
                                  + '/' + noteId
                                  + '/' + NotebookConstants.DATABASE_NOTE_FILE;

            async.series([
              function(callback) {
                if (!searchString)
                  return callback(null, true);

                FSAPI.grep(buildApiPath(_noteIndexPath), searchString, {
                    encoding: 'utf8',
                    regexModifier: 'gi',
                    matchOnly: false,
                    testOnly: true,
                    parseFormat: true,
                    onSuccess: function(data) {
                      if (data)
                        callback(null, true);
                      else
                        callback("NO_MATCH", true);
                    },
                    onError: function(error) {
                      callback("Operation: File.Grep\n\nMessage: " + error.message, false);
                    }
                  }
                );
              },
              function(callback) {
                FSAPI.grep(buildApiPath(_noteIndexPath), "<title>(.*?)</title>",
                  {
                    regexModifier: 'i',
                    matchOnly: true,
                    onSuccess: function(data) {
                      if (!data)
                        return callback(
                          "Operation: File.Grep\n\n" +
                          "Message: Invalid Format\n\n" +
                          "File: " + _noteIndexPath, true
                        );

                      _noteDescriptors.push({
                        notebookNode: node,
                        id: noteId,
                        noteStat: stats[i],
                        noteTitle: data,
                        noteContent: ""
                      });

                      callback(null, true);
                    },
                    onError: function(error) {
                      callback("Operation: File.Grep\n\nMessage: " + error.message, false);
                    }
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
        },
        onError: function(error) {
          NotebookDispatcher.dispatch({
            actionType: NotebookActionConstants.NOTEBOOK_DATABASE_LOADNOTES_ERROR,
            notebookNode: node,
            searchString: searchString,
            error: "stat list error: " + _notebookPath + " : " + error.message
          });
        }
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

      for (let _i = 0; _i < _rootNode.children.length; _i++) {
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

        __loadNotes(child, function(noteDescriptors) {
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
      });
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
        __loadNotes(child, function(noteDescriptors) {
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
      });
    }
    else {
      __loadNotes(notebookNode, function(noteDescriptors) {
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
  selectNote: (index) => {
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
  setNoteSortMethod: (method) => {
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
  addNote: (notebookNode, title, content) => {
    if (!databaseStorage) return;

    var self = this;

    NotebookDispatcher.dispatch({
      actionType: NotebookActionConstants.NOTEBOOK_DATABASE_ADD_NOTE,
      notebookNode: notebookNode
    });

    var noteId = timestamp();
    var notePath = getBookshelfPath(notebookNode.id + '/' + noteId);

    FSAPI.exist(buildApiPath(notePath), {
      onSuccess: function(exist) {
        if (!exist) {
          FSAPI.createDirectory(buildApiPath(notePath), {
            onSuccess: function() {
              if (!title || title.trim() === "")
                title = "Untitled";

              content = content || "<p></p>";
              var emptyNote = "<html><head><title>" + title + "</title></head>" +
                      "<body style='margin:0 auto;'>" + content + "</body></html>";
              var indexPath = notePath + '/' + NotebookConstants.DATABASE_NOTE_FILE;

              // Write empty note
              FSAPI.writeFile(buildApiPath(indexPath), emptyNote, {
                onSuccess: function() {
                  // Get stat of the note
                  FSAPI.stat(buildApiPath(indexPath), {
                    onSuccess: function(stat) {
                      // Create assets folder for the note
                      FSAPI.createDirectory(buildApiPath(notePath + "/assets"), {
                        onSuccess: function() {
                          /**
                           * @define NoteDescriptor
                           * @member notebookNode {Object} Notebook node object
                           * @member id           {Number} Note ID
                           * @member noteStat     {Object} Note file state information
                           * @member noteTitle    {String} Note list item title text
                           * @member noteContent  {String} Note content in HTML format
                           */
                          NotebookDispatcher.dispatch({
                            actionType: NotebookActionConstants.NOTEBOOK_DATABASE_ADD_NOTE_SUCCESS,
                            noteDescriptor: {
                              notebookNode: notebookNode,
                              id: noteId,
                              noteStat: stat,
                              noteTitle: title,
                              noteContent: ""
                            }
                          });
                        },
                        onError: function(error) {
                          NotebookDispatcher.dispatch({
                            actionType: NotebookActionConstants.NOTEBOOK_DATABASE_ADD_NOTE_ERROR,
                            notebookNode: notebookNode,
                            error: "unable to create assets directory: " + error.message
                          });
                        }
                      });
                    },
                    onError: function(error) {
                      NotebookDispatcher.dispatch({
                        actionType: NotebookActionConstants.NOTEBOOK_DATABASE_ADD_NOTE_ERROR,
                        notebookNode: notebookNode,
                        error: "unable to get stat (" + indexPath + "): " + error.message
                      });
                    }
                  });
                },
                onError: function(error) {
                  NotebookDispatcher.dispatch({
                    actionType: NotebookActionConstants.NOTEBOOK_DATABASE_ADD_NOTE_ERROR,
                    notebookNode: notebookNode,
                    error: "unable to write " + NotebookConstants.DATABASE_NOTE_FILE + ": " + error.message
                  });
                }
              });
            },
            onError: function(error) {
              NotebookDispatcher.dispatch({
                actionType: NotebookActionConstants.NOTEBOOK_DATABASE_ADD_NOTE_ERROR,
                notebookNode: notebookNode,
                error: "unable to create directory: " + error.message
              });
            }
          });
        }
        else {
          /* Recursively call addNote to get different timecode as note path name */
          self.addNote(notebookNode, title, content);
        }
      }
    });
  },

  /**
   * Copy note
   * @method copyNote
   * @param noteDescriptor {Object} NoteDescriptor object of note to be copied
   */
  copyNote: (noteDescriptor) => {
    if (!databaseStorage) return;

    var self = this;

    NotebookDispatcher.dispatch({
      actionType: NotebookActionConstants.NOTEBOOK_DATABASE_COPY_NOTE,
      srcNoteDescriptor: noteDescriptor
    });

    var notePath = getNotePath(noteDescriptor);

    FSAPI.exist(buildApiPath(notePath), {
      onSuccess: function(exist) {
        if (exist) {
          var _copyNoteId = timestamp();
          var _copyNotePath = dirname(notePath) + '/' + _copyNoteId;

          FSAPI.copy(buildApiPath(notePath), buildApiPath(_copyNotePath), {
            onSuccess: function() {
              var _dstNoteFile = _copyNotePath + '/' + NotebookConstants.DATABASE_NOTE_FILE;

              FSAPI.readFile(buildApiPath(_dstNoteFile), {
                encoding: "utf8",
                onSuccess: function(noteData) {

                  FSAPI.grep(buildApiPath(_dstNoteFile), "<title>(.*?)</title>", {
                    regexModifier: 'i',
                    matchOnly: true,
                    onSuccess: function(data) {
                      var _noteTitle = data;

                      var re = new RegExp(encodeURIComponent(notePath), "g");
                      noteData = noteData.replace(re, encodeURIComponent(_copyNotePath));

                      FSAPI.writeFile(buildApiPath(_copyNotePath + '/' + NotebookConstants.DATABASE_NOTE_FILE), noteData, {
                        onSuccess: function() {
                          FSAPI.stat(buildApiPath(_copyNotePath), {
                            onSuccess: function(stat) {
                              NotebookDispatcher.dispatch({
                                actionType: NotebookActionConstants.NOTEBOOK_DATABASE_COPY_NOTE_SUCCESS,
                                srcNoteDescriptor: noteDescriptor,
                                dstNoteDescriptor: {
                                  notebookNode: noteDescriptor.notebookNode,
                                  id: _copyNoteId,
                                  noteStat: stat,
                                  noteTitle: _noteTitle
                                }
                              });
                            },
                            onError: function(error) {
                              NotebookDispatcher.dispatch({
                                actionType: NotebookActionConstants.NOTEBOOK_DATABASE_COPY_NOTE_ERROR,
                                srcNote: noteDescriptor,
                                error: "unable to get stat of " + _copyNotePath + ": " + error.message
                              });
                            }
                          });
                        },
                        onError: function(error) {
                          NotebookDispatcher.dispatch({
                            actionType: NotebookActionConstants.NOTEBOOK_DATABASE_COPY_NOTE_ERROR,
                            srcNoteDescriptor: noteDescriptor,
                            error: "unable to write " + _copyNotePath + ": " + error.message
                          });
                        }
                      });
                    },
                    onError: function(error) {
                      NotebookDispatcher.dispatch({
                        actionType: NotebookActionConstants.NOTEBOOK_DATABASE_COPY_NOTE_ERROR,
                        srcNoteDescriptor: noteDescriptor,
                        error: "grep src error: " + error.message
                      });
                    }
                  });
                },
                onError: function(error) {
                    NotebookDispatcher.dispatch({
                      actionType: NotebookActionConstants.NOTEBOOK_DATABASE_COPY_NOTE_ERROR,
                      srcNoteDescriptor: noteDescriptor,
                      error: "unable to read " + _dstNoteFile + ": " + error.message
                    });
                }
              });
            },
            onError: function(error) {
              NotebookDispatcher.dispatch({
                actionType: NotebookActionConstants.NOTEBOOK_DATABASE_COPY_NOTE_ERROR,
                srcNoteDescriptor: noteDescriptor,
                error: "unable to copy " + notePath + ": " + error.message
              });
            }
          });
        }
      }
    });
  },

  /**
   * Trash note
   * @method trashNote
   * @param noteDescriptor {Object} NoteDescriptor object of note to be removed
   */
  trashNote: (noteDescriptor) => {
    if (!databaseStorage) return;

    var notePath = getNotePath(noteDescriptor);

    NotebookDispatcher.dispatch({
      actionType: NotebookActionConstants.NOTEBOOK_DATABASE_TRASH_NOTE,
      noteDescriptor: noteDescriptor
    });

    FSAPI.exist(buildApiPath(notePath), {
      onSuccess: function(exist) {
        if (exist) {
          FSAPI.removeFile(buildApiPath(notePath), {
            onSuccess: function() {
              NotebookDispatcher.dispatch({
                actionType: NotebookActionConstants.NOTEBOOK_DATABASE_TRASH_NOTE_SUCCESS,
                noteDescriptor: noteDescriptor
              });
            },
            onError: function(error) {
              NotebookDispatcher.dispatch({
                actionType: NotebookActionConstants.NOTEBOOK_DATABASE_TRASH_NOTE_ERROR,
                noteDescriptor: noteDescriptor,
                error: "unable to remove " + notePath + ": " + error.message
              });
            }
          });
        }
      }.bind(this)
    });
  },

  /**
   * Read note title and content
   * @method readNote
   * @param noteDescriptor {Object} NoteDescriptor object of note to be loaded
   */
  readNote: (noteDescriptor) => {
    if (!databaseStorage) return;

    function __replaceQueryString(url, param, value) {
      var re = new RegExp("([?|&])" + param + "=.*?(&|$|\")","ig");
      if (url.match(re))
        return url.replace(re,'$1' + param + "=" + value + '$2');
      else
        return url;
    }

    var noteFile = getNotePath(noteDescriptor) + '/' + NotebookConstants.DATABASE_NOTE_FILE;

    NotebookDispatcher.dispatch({
      actionType: NotebookActionConstants.NOTEBOOK_DATABASE_READ_NOTE,
      noteDescriptor: noteDescriptor
    });

    if (noteDescriptor.status === 'Saving') {
      NotebookDispatcher.dispatch({
        actionType: NotebookActionConstants.NOTEBOOK_DATABASE_READ_NOTE_SUCCESS,
        noteDescriptor: noteDescriptor
      });

      return;
    }

    FSAPI.readFile(buildApiPath(noteFile), {
      encoding: "utf8",
      onSuccess: function(data) {
        /* Remove all single &nbsp; between tags, and extract contents inside <body></body> */
        var content = data.replace(/\>&nbsp;\</gi,'\>\<')
                  .match(/\<body[^>]*\>([^]*)\<\/body/m)[1] || "";
        noteDescriptor.noteContent = __replaceQueryString(content, "disk_uuid", databaseStorage.uuid);

        NotebookDispatcher.dispatch({
          actionType: NotebookActionConstants.NOTEBOOK_DATABASE_READ_NOTE_SUCCESS,
          noteDescriptor: noteDescriptor
        });
      },
      onError: function(error) {
        NotebookDispatcher.dispatch({
          actionType: NotebookActionConstants.NOTEBOOK_DATABASE_READ_NOTE_ERROR,
          noteDescriptor: noteDescriptor,
          error: "unable to read " + noteFile + ": " + error.message
        });
      }
    });
  },

  /**
   * Cache dirty note content before saving
   * @method cacheDirtyNote
   * @param noteDescriptor {Object} NoteDescriptor object of note
   * @param dirtyTitle {String} Dirty note title
   * @param dirtyContent {String} Dirty (Modifing) note content
   */
  cacheDirtyNote: (noteDescriptor, dirtyTitle, dirtyContent) => {
    if ((
        noteDescriptor.noteTitle != dirtyTitle ||
        noteDescriptor.noteContent != dirtyContent.replace(/\>&nbsp;\</gi,'\>\<')
      ) && (
        noteDescriptor.dirtyNoteTitle != dirtyTitle ||
        noteDescriptor.dirtyNoteContent != dirtyContent.replace(/\>&nbsp;\</gi,'\>\<')
      )
    ) {
      noteDescriptor.dirtyNoteTitle = dirtyTitle;
      noteDescriptor.dirtyNoteContent = dirtyContent;

      NotebookDispatcher.dispatch({
        actionType: NotebookActionConstants.NOTEBOOK_DATABASE_CACHE_DIRTY_NOTE,
        noteDescriptor: noteDescriptor
      });
    }
  },

  /**
   * Save note content, if the content has no change, do nothing and just return.
   * @mehotd saveNote
   * @param noteDescriptor {Object} NoteDescriptor object of note to be saved
   * @return {Boolean} false if note has no change and do no action, otherwise return true.
   */
  saveNote: (noteDescriptor, manually) => {
    if (!databaseStorage) return;

    var self = this;
    var notePath = getNotePath(noteDescriptor);

    NotebookDispatcher.dispatch({
      actionType: NotebookActionConstants.NOTEBOOK_DATABASE_SAVE_NOTE,
      noteDescriptor: noteDescriptor,
      manually: manually
    });

    if (!noteDescriptor.dirtyNoteTitle && !noteDescriptor.dirtyNoteContent) {
      NotebookDispatcher.dispatch({
        actionType: NotebookActionConstants.NOTEBOOK_DATABASE_SAVE_NOTE_SUCCESS,
        noteDescriptor: noteDescriptor
      });
      return;
    }

    /**
     * Grab HTML resources procedure:
     * 1) Find cross site resources (<img src='http://www.somewhere.com/image.jpg'>)
     * 2) Download cross site resources to our assets folder
     * 3) Replace cross site resource URL with our assets URL
     */
    function __grabResources(content, cb) {
      var _imgs = content.match(/<img[^>]+src="?([^"\s]+)"?[^>]*\/>/gi);

      if (_imgs && _imgs.length > 0) {
        var _imgName = timestamp();

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

          /* Test if resource is from local URL, if not, download it to userdata */
          if (
            !(new RegExp(/^(\/api\/v1\/fs\/)/)).test(_src) &&
            !(new RegExp(/^(\/apps\/[iuc]a\/)/)).test(_src) &&
            !(new RegExp(/^(img\/)/)).test(_src)
          ) {
            var assetFile = notePath + '/assets/' + _fileUploadName;

            FSAPI.wget(buildApiPath(assetFile), _src, {
              onSuccess: function() {
                content = unescape(escape(content).replace(
                  new RegExp(escape(_src), 'g'),
                  escape (
                    "/api/v1/fs/file/"
                    + encodeURIComponent(assetFile)
                    + (databaseStorage.uuid
                       ? "?disk_uuid=" + databaseStorage.uuid
                       : "")
                  )
                ));
                __grabNext();
              },
              onError: function(error) {
                console.log("Unable to save file from URL " + _src);
                content = unescape(escape(content).replace(
                  new RegExp(escape(_src), 'g'),
                  escape("img/not-available.png")
                ));
                __grabNext();
              }
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

      //if (noteDescriptor.noteTitle === title && noteDescriptor.noteContent === content) {
      //    return (cb && cb());
      //}

      var noteFile = notePath  + '/' + NotebookConstants.DATABASE_NOTE_FILE;

      FSAPI.writeFile(buildApiPath(noteFile), _doc, {
        onSuccess: function() {
          /* Update summary.json */
          self.saveNoteSummary(noteDescriptor, { title: title }, function(summary, error) {
            if (error)
              return (cb && cb("unable to update " + noteFile + ": " + error.message));

            /* Update last modified time */
            FSAPI.touch(buildApiPath(notePath), {
              onSuccess: function() {
                FSAPI.stat(buildApiPath(notePath), {
                  onSuccess: function(stat) {
                    noteDescriptor.noteTitle = title;
                    noteDescriptor.noteContent = content;
                    noteDescriptor.noteSummary = summary;
                    noteDescriptor.noteStat = stat;
                    noteDescriptor.dirtyNoteTitle = null;
                    noteDescriptor.dirtyNoteContent = null;
                    return (cb && cb());
                  },
                  onError: function(error) {
                    cb && cb("unable to get stat of " + notePath + ": " + error.message);
                  }
                });
              },
              onError: function(error) {
                cb && cb("unable to touch " + notePath + ": " + error.message);
              }
            });
          });
        },
        onError: function(error) {
          cb && cb("unable to write " + noteFile + ": " + error.message);
        }
      });
    }

    // FIXME: should save content first, then grab resource
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
  saveNoteSummary: (noteDescriptor, summary, callback) => {
    var self = this;
    var notePath = getNotePath(noteDescriptor);
    var summaryPath = notePath + "/summary.json";

    FSAPI.exist(buildApiPath(summaryPath), {
      onSuccess: function(exist) {
        if (exist) {
          FSAPI.readFile(buildApiPath(summaryPath), {
            encoding: "utf8",
            onSuccess: function(data) {
              try {
                var _newSummary = assign(JSON.parse(data), summary);

                FSAPI.writeFile(buildApiPath(summaryPath), JSON.stringify(_newSummary), {
                  onSuccess: function() {
                    callback(_newSummary, null);
                  },
                  onError: function(error) {
                    callback(null, error);
                  }
                });
              }
              catch (error) {
                callback(null, error);
              }
            },
            onError: function(error) {
              callback(null, error);
            }
          });
        }
        else {
          FSAPI.writeFile(buildApiPath(summaryPath), JSON.stringify(summary), {
            onSuccess: function() {
              callback(summary, null);
            },
            onError: function(error) {
              callback(null, error);
            }
          });
        }
      }
    });
  },

  /**
   * Renew note modified date. Usually used to update last modified date of manually saved note after flushing
   * other dirty notes to ensure the manually saved note has latest modified date.
   * @method renewNoteModifyDate
   * @param noteDescriptor {Object} NoteDescriptor object of note
   */
  renewNoteModifyDate: (noteDescriptor) => {
    var notePath = getNotePath(noteDescriptor);

    FSAPI.touch(buildApiPath(notePath), {
      onError: function(error) {
        FSAPI.stat(buildApiPath(notePath), {
          onSuccess: function(stat) {
            noteDescriptor.noteStat = stat;
          }
        });
      }.bind(this)
    });
  },

  /**
   * Clear unused note assets
   * @method clearUselessAssets
   * @param noteDescriptor {Object} NoteDescriptor object of note to be clearring useless assets
   * @param afterDelay {Number} Delay a period of time (in millisecond) before clearing useless assets
   */
  clearUselessAssets: (noteDescriptor, afterDelay) => {
    if (!databaseStorage) return;

    var self = this;
    var notePath = getNotePath(noteDescriptor);

    function __removeUseless(items, i, cb) {
      var noteFile = notePath  + '/' + NotebookConstants.DATABASE_NOTE_FILE;

      FSAPI.grep(buildApiPath(noteFile), items[i], {
        testOnly: true,
        onSuccess: function(data) {
          if (!data) {
            console.log("Prepare to remove unused asset '" + items[i]);
            var assetFile = notePath + '/assets/' + items[i];

            FSAPI.removeFile(buildApiPath(assetFile), {
              onSuccess: function() {
                console.log("Unused asset '" + items[i] + "' removed");
                if (i === items.length - 1)
                  cb && cb();
                else
                  __removeUseless(items, i + 1, cb);
              },
              onError: function(error) {
                cb && cb("unable to remove " + assetFile + ": " + error.message);
              }
            });
          }
          else {
            if (i === items.length - 1)
              cb && cb();
            else
              __removeUseless(items, i + 1, cb);
          }
        },
        onError: function(error) {
          cb && cb("unable to read " + noteFile + ": " + error.message);
        }
      });
    }

    setTimeout(function() {
      NotebookDispatcher.dispatch({
        actionType: NotebookActionConstants.NOTEBOOK_DATABASE_CLEAR_USELESS_NOTE_ASSETS,
        noteDescriptor: noteDescriptor
      });

      var assetsDir = notePath + "/assets";

      FSAPI.list(buildApiPath(assetsDir), {
        onSuccess: function(items) {
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
        },
        onError: function(error) {
          NotebookDispatcher.dispatch({
            actionType: NotebookActionConstants.NOTEBOOK_DATABASE_CLEAR_USELESS_NOTE_ASSETS_ERROR,
            noteDescriptor: noteDescriptor,
            error: "unable to list " + assetsDir + ": " + error.message
          });
        }
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
  takeNoteSnapshot: (noteDescriptor, snapshotDOMContainer, width, height) => {
    if (!databaseStorage) return;

    var self = this;
    var snapshotPath = getBookshelfPath(
      noteDescriptor.notebookNode.id + '/' + noteDescriptor.id + '/' + NotebookConstants.DATABASE_NOTE_SNAPSHOT_FILE
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

        FSAPI.writeFile(buildApiPath(snapshotPath), base64ToBlob(data), {
          onSuccess: function() {
            NotebookDispatcher.dispatch({
              actionType: NotebookActionConstants.NOTEBOOK_DATABASE_TAKE_NOTE_SNAPSHOT_SUCCESS,
              noteDescriptor: noteDescriptor
            });
          },
          onError: function(error) {
            NotebookDispatcher.dispatch({
              actionType: NotebookActionConstants.NOTEBOOK_DATABASE_TAKE_NOTE_SNAPSHOT_ERROR,
              noteDescriptor: noteDescriptor,
              error: "unable to write snapshot to " + snapshotPath + ": " + error.message
            });
          }
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
  attachFilesToNote: (noteDescriptor, files) => {
    var self = this;
    var notePath = getNotePath(noteDescriptor);

    NotebookDispatcher.dispatch({
      actionType: NotebookActionConstants.NOTEBOOK_DATABASE_ATTACH_FILE_TO_NOTE,
      noteDescriptor: noteDescriptor,
      files: files
    });

    function __uploadFile(fileObject, onCompvare, onProgress, onError) {
      if (!fileObject.type) {
        onError("Directory uploading is not supported");
        onCompvare();
        return;
      }

      var _ext = fileObject.name.split(".").pop();
      _ext = _ext ? "." + _ext : "";

      noteDescriptor.fileUploadName = timestamp() + _ext;
      noteDescriptor.fileUploadPath = notePath + '/assets/' + noteDescriptor.fileUploadName;

      FSAPI.writeFile(buildApiPath(noteDescriptor.fileUploadPath), fileObject, {
        onSuccess: function(xhr) {
          noteDescriptor.fileUploadName = null;
          noteDescriptor.fileUploadXHR = null;
          onCompvare();
        },
        onProgress: function(progress, xhr) {
          noteDescriptor.fileUploadXHR = xhr;
          onProgress(progress);
        },
        onError: function(error) {
          onError(error);
        }
      });
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
        FSAPI.touch(buildApiPath(notePath + "/assets"));
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
  cancelAttachFile: (noteDescriptor) => {
    if (noteDescriptor.fileUploadXHR) {
      FSAPI.abortUploadFile(noteDescriptor.fileUploadXHR);

      NotebookDispatcher.dispatch({
        actionType: NotebookActionConstants.NOTEBOOK_DATABASE_CANCEL_ATTACH_FILE_TO_NOTE,
        noteDescriptor: noteDescriptor
      });
    }
  }
}
