// FIXME:
//  1. Avoid drag notebook on top of "All Notes"
//  2. Any notebook dragged on, on top of or on bottom of "All Notes", move it on bottom of "All Notes"

function Bookshelf(viewController) {
    var self = this;

    this.fileManager = viewController.fileManagerClient;
    this.jqueryElement = $("#bookshelf");
    this.storages = [];
    this.storageUUID = undefined;
    this.confirmDialog = new Dialog("confirm-dialog");
    this.confirmDialog.setTitle("Are you sure?");

    /* Build time code */
    this.getTimecode = function() {
        var now = new Date();
        return now.getFullYear()
                + ("0" + (now.getMonth() + 1)).slice(-2)
                + ("0" + now.getDate()).slice(-2)
                + ("0" + now.getHours()).slice(-2)
                + ("0" + now.getMinutes()).slice(-2)
                + ("0" + now.getSeconds()).slice(-2)
                + ("0" + now.getMilliseconds()).slice(-2);
    };

    /* Initialize Dialogs */
    function checkDuplicateStack(name) {
        var node = self.getStorage().ui.tree("getNodeByName", name);
        if (node && node.isFolder())
            return true;
        return false;
    };

    function checkDuplicateNotebook(name) {
        var node = self.getStorage().ui.tree("getNodeByName", name);
        if (node && !node.isFolder())
            return true;
        return false;
    };

    var stackCreateDialog = new TextInputDialog("Stack", "#create-stack-dialog", "Create");
    var notebookCreateDialog = new TextInputDialog("Notebook", "#create-notebook-dialog", "Create");
    var notebookRenameDialog = new TextInputDialog("Notebook", "#rename-notebook-dialog", "Rename");

    stackCreateDialog.addCustomCheck(checkDuplicateStack, "There is already a stack named '#name'");
    notebookCreateDialog.addCustomCheck(checkDuplicateNotebook, "There is already a notebook named '#name'");
    notebookRenameDialog.addCustomCheck(checkDuplicateNotebook, "There is already a notebook named '#name'");

    function showRenameDialog(name, type) {
        var node = self.getStorage().ui.tree("getNodeByName", name);

        notebookRenameDialog.onCreateClick(function(newName) {
            rename(node, newName);
        });

        notebookRenameDialog.open(name);
    }

    function showDeleteConfirm(name, type) {
        if (type === "stack")
            self.confirmDialog.setMessage("Do you want to delete notebook stack '" + name + "' ?");
        else
            self.confirmDialog.setMessage("Do you want to delete notebook '" + name + "' ?");

        self.confirmDialog.setButton([
            {
                text: "Yes", click: function(event) {
                    var node = self.getStorage().ui.tree("getNodeByName", name);
                    var parent = node.parent;

                    remove(node, false);

                    if (parent && parent.children.length === 0) {
                        remove(parent, true);
                    }

                    self.confirmDialog.close();
                }
            },
            { text: "No", click: function(event) { self.confirmDialog.close(); } }
        ]);

        self.confirmDialog.open();
    }

    /* Initialize Popup menu */
    var storageActionMenu = $(
        "<ul style='position:absolute;z-index:9999;'>" +
        "<li>New notebook</li>" +
        "</ul>"
    )
    .menu()
    .appendTo("body")
    .hide();

    this.registerStorageActionClick = function() {
        $("#action-button-storage-" + self.storageUUID + " a").unbind("click");
        $("#action-button-storage-" + self.storageUUID + " a").click(function(event) {
            event.stopPropagation();
            event.preventDefault();

            lastNotebookPopupMenu && lastNotebookPopupMenu.hide();

            if (storageActionMenu.is(":visible"))
                storageActionMenu.hide();
            else
                storageActionMenu.show();

            storageActionMenu.off("menuselect");
            storageActionMenu.position({
                my: "left top",
                at: "left bottom",
                of: $(this)
            })
            .on("menuselect", function(event, ui) {
                event.preventDefault();

                var selectedOption = ui.item.text();
                storageActionMenu.hide();

                if (selectedOption === "New notebook") {
                    notebookCreateDialog.onCreateClick(function(name) {
                        create(name, "notebook");
                    });

                    notebookCreateDialog.open();
                }
            });
        });
    }

    this.unregisterStorageActionClick = function() {
        if (self.storageUUID)
            $("#action-button-storage-" + self.storageUUID + " a").unbind("click");
    }

    var notebookActionMenu = [];
    var lastNotebookPopupMenu;

    function updateHoverHandler() {
        $("ul.jqtree-tree li > .jqtree-element").hover(
            function () {
                var idx = $("ul.jqtree-tree li > .jqtree-element").index(this);
                var name = $(this).find("span.jqtree-title").text();
                var type = $(this).find("span.jqtree-title-folder") ? "stack" : "notebook";

                $(this).find("span.action-button").remove();
                self.getStorage().ui.unbind("tree.contextmenu");

                if (name === "All Notes")
                    return;

                $(this).append(
                    $(
                        "<span id='action-button-notebook-" + idx + "' class='action-button'>" +
                        "<a href='#'><i class='fa fa-caret-square-o-down'></i>&nbsp;</a>" +
                        "</span>"
                    )
                );

                var popupMenu = function(event) {
                    event.stopPropagation();
                    event.preventDefault();

                    var element = event.target;
                    if (element.id.indexOf("notebook-tree") === 0) {
                        element = $("#action-button-notebook-" + idx);
                    }

                    storageActionMenu && storageActionMenu.hide();

                    if (lastNotebookPopupMenu !== notebookActionMenu[idx])
                        lastNotebookPopupMenu.hide();

                    if (notebookActionMenu[idx]) {
                        if (notebookActionMenu[idx].is(":visible"))
                            notebookActionMenu[idx].hide();
                        else
                            notebookActionMenu[idx].show();
                    }
                    else
                        notebookActionMenu[idx] = $(
                            "<ul style='position:absolute;z-index:9999;'>" +
                            "<li>Rename</li>" +
                            "<li>Delete</li>" +
                            "</ul>"
                        )
                        .menu()
                        .appendTo("body");

                    lastNotebookPopupMenu = notebookActionMenu[idx];

                    notebookActionMenu[idx].off("menuselect");
                    notebookActionMenu[idx].position({
                        my: "left top",
                        at: "left bottom",
                        of: element
                    })
                    .on("menuselect", function(event, ui) {
                        event.preventDefault();

                        var selectedOption = ui.item.text();
                        notebookActionMenu[idx].hide();

                        if (selectedOption === "Rename")
                            showRenameDialog(name, type);
                        else if (selectedOption === "Delete")
                            showDeleteConfirm(name, type);
                    });
                };

                self.getStorage().ui.bind("tree.contextmenu", popupMenu);
                $("#action-button-notebook-" + idx + " a").click(popupMenu);
            },
            function() {
                $(this).find("span.action-button").remove();
            }
        );
    }

    $(document).on("click", function(e) {
        var $target = $(e.target);

        if (!$target.attr("id") || $target.attr("id").indexOf("action-button-storage-") !== 0)
            storageActionMenu.hide();

        if (!$target.attr("id") || $target.attr("id").indexOf("action-button-notebook-") !== 0)
            lastNotebookPopupMenu && lastNotebookPopupMenu.hide();
    });

    /* Build real path from node or string */
    this.getPath = function(node) {
        var path = "";

        if (typeof node === "object")
            path = "/" + node.id;
        else if (typeof node === "string")
            path = node;

        return "bookshelf" + path;
    };

    /* Create and initialize tree */
    this.initNotebookTree = function() {
        if (!self.getStorage().ui) {
            self.getStorage().ui = $("#notebook-tree-" + self.storageUUID);

            /* Initialize notebook tree */
            self.getStorage().ui.unbind("tree.init");
            self.getStorage().ui.bind("tree.init", function() {
                self.selectNotebookAtIndex(0);
            });

            self.getStorage().ui.unbind("tree.open");
            self.getStorage().ui.bind("tree.open", function(event) {
                saveNotebookTree(1000);
            });

            self.getStorage().ui.unbind("tree.close");
            self.getStorage().ui.bind("tree.close", function(event) {
                saveNotebookTree(1000);
            });

            self.getStorage().ui.unbind("tree.refresh");
            self.getStorage().ui.bind("tree.refresh", function() {
                updateHoverHandler();
                if (self.getStorage().ui.selectedNode) {
                    var node = self.getStorage().ui.tree("getNodeByName", self.getStorage().ui.selectedNode.name);
                    self.getStorage().ui.selectedNode = node;
                    self.getStorage().ui.tree("selectNode", node);
                }
                self.jqueryElement.trigger("bookshelf.afterOpen", { notebooks: self.getStorage().treeData });
            });

            self.getStorage().ui.unbind("tree.select");
            self.getStorage().ui.bind("tree.select", function(event) {
                if (event.node) {
                    self.getStorage().ui.selectedNode = event.node;
                    self.jqueryElement.trigger("bookshelf.select", { storage: self.storageUUID, node: event.node });
                }
            });

            self.getStorage().ui.unbind("tree.move");
            self.getStorage().ui.bind("tree.move", function(event) {
                event.preventDefault();

                var movedNode = event.move_info.moved_node;
                var movedNodeParent = event.move_info.previous_parent;
                var targetNode = event.move_info.target_node;
                var position = event.move_info.position;

                if (movedNode.name === "All Notes" || targetNode.name === "All Notes")
                    return;

                if (movedNode.isFolder() && (position === "inside" || (position !== "inside" && targetNode.getLevel() > 1)))
                    return;

                if (movedNode.isParentOf(targetNode))
                    return;

                if (targetNode.getLevel() > 1) {
                    /* Move node to existing stack, do not create second level folder */
                    if (position === "inside")
                        position = "after";
                    move(movedNode, targetNode, position);
                }
                else if (targetNode.isFolder() || position !== "inside") {
                    /* Move node to root level */
                    move(movedNode, targetNode, position);
                }
                else {
                    /* Create a new stack and move movedNote & targetNode to the stack */
                    stackCreateDialog.onCreateClick(function(name) {
                        create(name, "stack");

                        var stackNode = self.getStorage().ui.tree("getNodeByName", name);
                        move(targetNode, stackNode, "inside");
                        move(movedNode, stackNode, "inside");
                        self.getStorage().ui.tree("openNode", stackNode, true);

                        if (movedNodeParent && movedNodeParent.children.length === 0) {
                            remove(movedNodeParent, true);
                        }
                    });

                    stackCreateDialog.open();
                    return;
                }

                if (movedNodeParent && movedNodeParent.children.length === 0) {
                    remove(movedNodeParent, true);
                }
            });

            self.getStorage().ui.unbind("tree.click");
            self.getStorage().ui.bind("tree.click", function(event) {
                // The clicked node is "event.node"
            });

            /* Initialize notebook tree */
            self.getStorage().ui.tree({
                closedIcon: $("<i class='fa fa-caret-right'></i>"),
                openedIcon: $("<i class='fa fa-caret-down'></i>"),
                nodeIcon: $("<i class='fa fa-book'></i>"),
                onCreateLi: function(node, $li) {
                    if (node.name === "All Notes")
                        $li.find(".fa-book").replaceWith("<i class='fa fa-list'></i>");
                    else if (node.isFolder())
                        $li.find(".jqtree-title").before("<i class='fa fa-list-ul'></i>&nbsp;");
                },
                toggleable: false,
                dragAndDrop: true,
                autoOpen: false,
                data: self.getStorage().treeData
            });
        }
        else {
            self.getStorage().ui.tree("loadData", self.getStorage().treeData);
        }

        updateHoverHandler();
    }

    /*
     * Export tree data to json file.
     * Here we use a wait timer to prevent data corruption by many save tree data calls at a short period of time.
     */
    var saveNotebookTreeWaitTimer;
    function saveNotebookTree(wait, cb) {
        if (saveNotebookTreeWaitTimer)
            clearTimeout(saveNotebookTreeWaitTimer);

        wait = wait || 0;

        saveNotebookTreeWaitTimer = setTimeout(function() {
            var treeData = self.getStorage().ui.tree("toJson");
            self.fileManager.writeFile("bookshelf-tree.json", treeData, function(path, progress, error) {
                cb && cb(error);
                if (error) throw new Error("Unable to write bookshelf tree data");
            });
            saveNotebookTreeWaitTimer = undefined;
        }, wait);
    }

    /* Notebook management */
    function create(name, type) {
        if (type === "notebook") {
            var code = self.getTimecode();
            var path = self.getPath("/") + code;

            self.fileManager.exist(path, function(path, exist, isDir, error) {
                if (error) throw new Error("fs operation error");
                if (exist) throw new Error(path + " already exists");

                self.fileManager.createDirectory(path, function(path, error) {
                    if (error) throw new Error("unable to create " + path);
                    self.getStorage().ui.tree("appendNode", { label: name, id: parseInt(code) });
                    /* Select latest appended node */
                    var node = self.getStorage().ui.tree("getNodeByName", name);
                    if (node) self.getStorage().ui.tree("selectNode", node);
                    saveNotebookTree();
                });
            });
        }
        else {
            self.getStorage().ui.tree("appendNode", { label: name, id: 1 });
            saveNotebookTree();
        }
    }

    function rename(node, name) {
        self.getStorage().ui.tree("updateNode", node, name);
        saveNotebookTree();
        updateHoverHandler();
        self.jqueryElement.trigger("bookshelf.notebookModified", { storage: self.storageUUID, node: node });
    }

    function move(srcNode, dstNode, pos) {
        self.getStorage().ui.tree("moveNode", srcNode, dstNode, pos);
        saveNotebookTree();
    }

    function remove(node, isEmptyStack) {
        var nextNodeToSelect = node.getNextSibling();
        if (!nextNodeToSelect) nextNodeToSelect = node.getPreviousSibling();

        if (isEmptyStack) {
            /* Do nothing but remove node */
        }
        else if (node.isFolder()) {
            node.iterate(function(node) {
                if (!node.isFolder()) {
                    self.fileManager.remove(self.getPath(node), function(path, error) {
                        if (error) throw new Error("unable to remove " + path);
                        if (nextNodeToSelect) {
                            if (self.getStorage().ui.selectedNode === nextNodeToSelect) {
                                /**
                                 * Selected node is the same as nextNodeToSelect, this will not trigger 'tree.select' event by 'selectNode' api.
                                 * Thus, we do trigger 'bookshelf.select' manually here to notify notebook.html to update notebook list.
                                 */
                                self.jqueryElement.trigger("bookshelf.select", {
                                    storage: self.storageUUID,
                                    node: nextNodeToSelect
                                });
                            }
                            else {
                                self.getStorage().ui.selectedNode = nextNodeToSelect;
                                self.getStorage().ui.tree("selectNode", self.getStorage().ui.selectedNode);
                            }
                        }
                        else {
                            self.getStorage().ui.selectedNode = undefined;
                            self.jqueryElement.trigger("bookshelf.select", {
                                storage: self.storageUUID,
                                node: self.getStorage().ui.selectedNode
                            });
                        }
                    });
                }
                return true;
            });
        }
        else {
            self.fileManager.remove(self.getPath(node), function(path, error) {
                if (error) throw new Error("unable to remove " + path);
                if (nextNodeToSelect) {
                    if (self.getStorage().ui.selectedNode === nextNodeToSelect) {
                        /**
                         * Selected node is the same as nextNodeToSelect, this will not trigger 'tree.select' event by 'selectNode' api.
                         * Thus, we do trigger 'bookshelf.select' manually here to notify notebook.html to update notebook list.
                         */
                        self.jqueryElement.trigger("bookshelf.select", { storage: self.storageUUID, node: nextNodeToSelect });
                    }
                    else {
                        self.getStorage().ui.selectedNode = nextNodeToSelect;
                        self.getStorage().ui.tree("selectNode", self.getStorage().ui.selectedNode);
                    }
                }
                else {
                    self.getStorage().ui.selectedNode = undefined;
                    self.jqueryElement.trigger("bookshelf.select", { storage: self.storageUUID, node: self.getStorage().ui.selectedNode });
                }
            });
        }

        self.getStorage().ui.tree("removeNode", node);
        saveNotebookTree();
    }

    this.loadTreeData = function(cb) {
        /* Reset tree data */
        self.getStorage().treeData = [{ name: "All Notes" }];

        /* Create /bookshelf if necessary */
        self.fileManager.exist(self.getPath(), function(path, exist, isDir, error) {
            if (error) {
                cb && cb(error);
                throw new Error("fs operation error");
            }

            if (!exist) {
                self.fileManager.createDirectory(self.getPath(), function(path, error) {
                    if (error) {
                        cb && cb(error);
                        throw new Error("unable to create /bookshelf");
                    }
                });
            }
            else if (exist && !isDir) {
                self.fileManager.remove(self.getPath(), function(path, error) {
                    if (error) {
                        cb && cb(error);
                        throw new Error("unable to remove /bookshelf");
                    }

                    self.fileManager.createDirectory(self.getPath(), function(path, error) {
                        if (error) {
                            cb && cb(error);
                            throw new Error("unable to create /bookshelf");
                        }
                    });
                });
            }
        });

        /* Load notebook tree data from bookshelf-tree.json */
        self.fileManager.exist("bookshelf-tree.json", function(path, exist, isDir, error) {
            if (error) {
                cb && cb(error);
                throw new Error("File system operation error");
            }

            if (exist) {
                self.fileManager.readFile("bookshelf-tree.json", "utf8", function(path, data, error) {
                    if (error) {
                        cb && cb(error);
                        throw new Error("Unable to read bookshelf tree data");
                    }

                    try {
                        self.getStorage().treeData = JSON.parse(data);
                    }
                    catch (error) {
                        self.getStorage().treeData = [];
                        cb && cb(error);
                        throw new Error("Parse tree data error" + error + "\ndata:\n" + data);
                    }

                    cb && cb();
                });
            }
            else {
                self.fileManager.writeFile("bookshelf-tree.json", JSON.stringify(self.getStorage().treeData), function(path, progress, error) {
                    if (error) {
                        cb && cb(error);
                        throw new Error("Unable to write bookshelf tree data");
                    }
                    cb && cb();
                });
            }
        });
    }

    /* Initialize accordion at final step of UI initializion to fit tree column width */
    $("#accordion").accordion({
        heightStyle: "fill",
        /* Temporarily enable collapsible to get activate event of first activation */
        collapsible: true,
        /* Make accordion collapsed while first initialization, we'll activate internal user storage later */
        active: false,
        activate: function(event, ui) {
            /* Disable currently used storage action button */
            self.unregisterStorageActionClick();

            var uuid = ui.newHeader.text().trim().split("::")[1];
            self.jqueryElement.trigger("bookshelf.switchStorage", uuid);
        }
    })
    .accordion("option", "active", 0) /* Active internal user storage */
    .accordion("option", "collapsible", false); /* Disable collapsible at last */
}

Bookshelf.prototype.fitSize = function(width, height) {
    this.jqueryElement.width(width);
    this.jqueryElement.height(height);
    $("div[id^='notebook-tree-']").height(height - (30 * $("div[id^='notebook-tree-']").length));
}

Bookshelf.prototype.addStorage = function(disk) {
    $('#accordion').prepend(
        "<h3 id='h3-"+ disk.uuid + "'>" +
        "<span class='storage-name'>" + (disk.name ? disk.name : disk.mountpoint) + "</span>" +
        "<span style='display:none'>::" + disk.uuid + "</span>" +
        "<span id='action-button-storage-" + disk.uuid + "' class='action-button'>" +
        "<a href='#'><i class='fa fa-caret-square-o-down'></i></a>" +
        "</span></h3>" +
        "<div id='notebook-tree-" + disk.uuid +"' class='notebook-tree'></div>"
    );
    this.storages[disk.uuid] = { disk: disk };
    if (!this.storageUUID)
        this.storageUUID = disk.uuid;
    $('#accordion').accordion("refresh");
}

Bookshelf.prototype.removeStorage = function(disk) {
    if (this.storages[disk.uuid]) {
        if ($("#h3-" + disk.uuid)) {
            $("#h3-" + disk.uuid).remove();
            $("#notebook-tree-" + disk.uuid).remove();
            this.storages[disk.uuid] = undefined;
            $("#accordion").accordion("refresh");
        }
    }
}

Bookshelf.prototype.getStorage = function(uuid) {
    return this.storages[uuid || this.storageUUID];
}

Bookshelf.prototype.open = function(uuid, cb) {
    var self = this;

    self.storageUUID = uuid;
    self.loadTreeData(function(error) {
        if (error) {
            self.getStorage().ui = undefined;
        }
        else {
            self.initNotebookTree();
            self.registerStorageActionClick();
        }
        cb && cb(error);
    });
}

Bookshelf.prototype.close = function(uuid) {
    this.unregisterStorageActionClick();
    this.storages[uuid].ui = undefined;
    this.storages[uuid].treeData = [];
    if (this.storageUUID === uuid)
        this.storageUUID = undefined;
}

Bookshelf.prototype.selectNotebookAtIndex = function(index) {
    var treeData = this.getStorage().ui.tree("getTree").getData();
    if (treeData.length > 0) {
        var node = this.getStorage().ui.tree("getNodeByName", treeData[index].name);
        if (node) this.getStorage().ui.tree("selectNode", node);
    }
}
