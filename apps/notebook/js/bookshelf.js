function Bookshelf(fileManager) {
    var self = this;

    this.notebookTreeData = [{name:"All Notes"}];
    this.selectedNode = undefined;
    this.fileManager = fileManager;
    this.jqueryElement = $("#bookshelf");
    this.confirmDialog = new Dialog("confirm-dialog");
    this.confirmDialog.setTitle("Are you sure?");

    /* Initialize Dialogs */
    var checkDuplicateStack = function(name) {
        var node = $("#notebook-tree").tree("getNodeByName", name);
        if (node && node.isFolder())
            return true;
        return false;
    };

    var checkDuplicateNotebook = function(name) {
        var node = $("#notebook-tree").tree("getNodeByName", name);
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
        var node = $("#notebook-tree").tree("getNodeByName", name);

        notebookRenameDialog.onCreateClick(function(newName) {
            //alert("Rename " + node.name + " at level " + node.getLevel() + " parent " + node.parent.name);
            rename(node, newName);
        });

        notebookRenameDialog.open();
    }

    function showDeleteConfirm(name, type) {
        if (type === "stack")
            self.confirmDialog.setMessage("Do you want to delete notebook stack '" + name + "' ?");
        else
            self.confirmDialog.setMessage("Do you want to delete notebook '" + name + "' ?");

        self.confirmDialog.setButton([
            {
                text: "Yes", click: function(event) {
                    var node = $("#notebook-tree").tree("getNodeByName", name);
                    var parent = node.parent;
                    //alert("Delete " + node.name + " at level " + node.getLevel() + " parent " + node.parent.name);
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
    var allNotebooksPopupMenu = $(
        "<ul style='position:absolute;z-index:9999;'>" +
        "<li>New notebook</li>" +
        "</ul>"
    )
    .menu()
    .appendTo("body")
    .hide();

    var notebookPopupMenu = [];
    var lastNotebookPopupMenu;

    var updateHoverHandler = function() {
        $("ul.jqtree-tree li > .jqtree-element").hover(
            function() {
                var idx = $("ul.jqtree-tree li > .jqtree-element").index(this);
                var name = $(this).find("span.jqtree-title").text();
                var type = $(this).find("span.jqtree-title-folder") ? "stack" : "notebook";

                $(this).find("span.action-button").remove();
                $("#notebook-tree").unbind("tree.contextmenu");

                if (name === "All Notes")
                    return;

                $(this).append(
                    $(
                        "<span id='notebook-down-button-" + idx + "' class='action-button'>" +
                        "<a href='#'><i class='fa fa-caret-square-o-down'></i>&nbsp;</a>" +
                        "</span>"
                    )
                );

                var popupMenu = function(event) {
                    event.stopPropagation();
                    event.preventDefault();

                    var element = event.target;
                    if (element.id === "notebook-tree") {
                        element = $("#notebook-down-button-" + idx);
                    }

                    allNotebooksPopupMenu && allNotebooksPopupMenu.hide();

                    if (lastNotebookPopupMenu !== notebookPopupMenu[idx])
                        lastNotebookPopupMenu.hide();

                    if (notebookPopupMenu[idx]) {
                        if (notebookPopupMenu[idx].is(":visible"))
                            notebookPopupMenu[idx].hide();
                        else
                            notebookPopupMenu[idx].show();
                    }
                    else
                        notebookPopupMenu[idx] = $(
                            "<ul style='position:absolute;z-index:9999;'>" +
                            "<li>Rename</li>" +
                            "<li>Delete</li>" +
                            "</ul>"
                        )
                        .menu()
                        .appendTo("body");

                    lastNotebookPopupMenu = notebookPopupMenu[idx];

                    notebookPopupMenu[idx].off("menuselect");
                    notebookPopupMenu[idx].position({
                        my: "left top",
                        at: "left bottom",
                        of: element
                    })
                    .on("menuselect", function(event, ui) {
                        event.preventDefault();

                        var selectedOption = ui.item.text();
                        notebookPopupMenu[idx].hide();

                        if (selectedOption === "Rename")
                            showRenameDialog(name, type);
                        else if (selectedOption === "Delete")
                            showDeleteConfirm(name, type);
                    });
                };

                $("#notebook-tree").bind("tree.contextmenu", popupMenu);
                $("#notebook-down-button-" + idx + " a").click(popupMenu);
            },
            function() {
                $(this).find("span.action-button").remove();
            }
        );
    }

    $("#all-notebook-down-button a").click(function(event) {
        event.stopPropagation();
        event.preventDefault();

        lastNotebookPopupMenu && lastNotebookPopupMenu.hide();

        if (allNotebooksPopupMenu.is(":visible"))
            allNotebooksPopupMenu.hide();
        else
            allNotebooksPopupMenu.show();

        allNotebooksPopupMenu.off("menuselect");
        allNotebooksPopupMenu.position({
            my: "left top",
            at: "left bottom",
            of: $(this)
        })
        .on("menuselect", function(event, ui) {
            event.preventDefault();

            var selectedOption = ui.item.text();
            allNotebooksPopupMenu.hide();

            if (selectedOption === "New notebook") {
                notebookCreateDialog.onCreateClick(function(name) {
                    create(name, "notebook");
                });

                notebookCreateDialog.open();
            }
        });
    });

    $(document).on("click", function(e) {
        var $target = $(e.target);

        if (!$target.attr("id") || $target.attr("id") !== "all-notebook-down-button")
            allNotebooksPopupMenu.hide();

        if (!$target.attr("id") || $target.attr("id").indexOf("notebook-down-button-") !== 0)
            lastNotebookPopupMenu && lastNotebookPopupMenu.hide();
    });

    /* Build real path from node or string */
    this.getPath = function(node) {
        var path = "";

        if (typeof node === "object")
            path = "/" + node.name;
        else if (typeof node === "string")
            path = node;

        return "bookshelf" + path;
    };

    /* Initialize notebook tree */
    $("#notebook-tree").bind("tree.init", function() {});

    $("#notebook-tree").bind("tree.open", function(event) {
        saveNotebookTree();
    });

    $("#notebook-tree").bind("tree.close", function(event) {
        saveNotebookTree();
    });

    $("#notebook-tree").bind("tree.refresh", function() {
        updateHoverHandler();
        self.jqueryElement.trigger("bookshelf.loaded", { notebookTreeData: self.notebookTreeData });
    });

    $("#notebook-tree").bind("tree.select", function(event) {
        self.selectedNode = event.node;
        self.jqueryElement.trigger("bookshelf.select", { node: event.node });
    });

    $("#notebook-tree").bind("tree.move", function(event) {
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

                var stackNode = $("#notebook-tree").tree("getNodeByName", name);
                move(targetNode, stackNode, "inside");
                move(movedNode, stackNode, "inside");
                $("#notebook-tree").tree("openNode", stackNode, true);

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

    $("#notebook-tree").bind("tree.click", function(event) {
        // The clicked node is "event.node"
    });

    /* Create and initialize tree */
    function initNotebookTree() {
        /* Initialize notebook tree */
        $("#notebook-tree").tree({
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
            data: self.notebookTreeData
        });

        updateHoverHandler();
    }

    /*
     * Export tree data to json file.
     * Here we use a wait timer to prevent data corruption by many save tree data calls at a short period of time.
     */
    var saveNotebookTreeWaitTimer;
    function saveNotebookTree() {
        if (saveNotebookTreeWaitTimer)
            clearTimeout(saveNotebookTreeWaitTimer);

        saveNotebookTreeWaitTimer = setTimeout(function() {
            var notebookTreeData = $("#notebook-tree").tree("toJson");
            self.fileManager.writeFile("bookshelf-tree.json", notebookTreeData, function(path, progress, error) {
                if (error) throw new Error("Unable to write bookshelf tree data");
            });
            saveNotebookTreeWaitTimer = undefined;
        }, 500);
    }

    /* Notebook management */
    function create(name, type) {
        if (type === "notebook") {
            var path = self.getPath("/") + name;
            //console.log("create " + path);

            self.fileManager.exist(path, function(path, exist, isDir, error) {
                if (error) throw new Error("fs operation error");
                if (exist) throw new Error(path + " already exists");

                self.fileManager.createDirectory(path, function(path, error) {
                    if (error) throw new Error("unable to create " + path);
                    $("#notebook-tree").tree("appendNode", { label: name });
                    /* Select latest appended node */
                    var node = $("#notebook-tree").tree("getNodeByName", name);
                    if (node) $("#notebook-tree").tree("selectNode", node);
                    saveNotebookTree();
                });
            });
        }
        else {
            $("#notebook-tree").tree("appendNode", { label: name });
            saveNotebookTree();
        }
    }

    function rename(node, name) {
        if (!node.isFolder()) {
            var src = self.getPath(node);
            var dst = self.getPath("/") + name;

            //console.log("move " + src + " to " + dst);

            self.fileManager.move(src, dst, function(src, dst, error) {
                if (error) throw new Error("unable to move " + src + " to " + dst);
            });
        }

        self.jqueryElement.trigger("bookshelf.update", { node: node });
        $("#notebook-tree").tree("updateNode", node, name);

        saveNotebookTree();
        updateHoverHandler();
    }

    function move(srcNode, dstNode, pos) {
        $("#notebook-tree").tree("moveNode", srcNode, dstNode, pos);
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
                            self.selectedNode = nextNodeToSelect;
                            $("#notebook-tree").tree("selectNode", self.selectedNode);
                        }
                        else {
                            self.selectedNode = undefined;
                            self.jqueryElement.trigger("bookshelf.select", { node: self.selectedNode });
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
                    self.selectedNode = nextNodeToSelect;
                    $("#notebook-tree").tree("selectNode", self.selectedNode);
                }
                else {
                    self.selectedNode = undefined;
                    self.jqueryElement.trigger("bookshelf.select", { node: self.selectedNode });
                }
            });
        }

        $("#notebook-tree").tree("removeNode", node);
        saveNotebookTree();
    }

    /* Initialize accordion at final step of UI initializion to fit tree column width */
    $("#accordion").accordion({
        heightStyle: "fill",
        collapsible: false,
        active: 0
    });

    /* Create /bookshelf if necessary */
    self.fileManager.exist(self.getPath(), function(path, exist, isDir, error) {
        if (error) throw new Error("fs operation error");
        if (!exist) {
            self.fileManager.createDirectory(self.getPath(), function(path, error) {
                if (error) throw new Error("unable to create /bookshelf");
            });
        }
        else if (exist && !isDir) {
            self.fileManager.remove(self.getPath(), function(path, error) {
                if (error) throw new Error("unable to remove /bookshelf");

                self.fileManager.createDirectory(self.getPath(), function(path, error) {
                    if (error) throw new Error("unable to create /bookshelf");
                });
            });
        }
    });

    /* Load notebook tree data from bookshelf-tree.json */
    self.fileManager.exist("bookshelf-tree.json", function(path, exist, isDir, error) {
        if (error) throw new Error("File system operation error");
        if (exist) {
            self.fileManager.readFile("bookshelf-tree.json", "utf8", function(path, data, error) {
                if (error) throw new Error("Unable to read bookshelf tree data");

                try {
                    self.notebookTreeData = JSON.parse(data);
                    initNotebookTree();
                }
                catch (err) {
                    alert("Parse Tree Data " + err);
                }
            });
        }
        else {
            self.fileManager.writeFile("bookshelf-tree.json", self.notebookTreeData, function(path, progress, error) {
                if (error) throw new Error("Unable to write bookshelf tree data");
                initNotebookTree();
            });
        }
    });
}

Bookshelf.prototype.fitSize = function(width, height) {
    this.jqueryElement.width(width * 0.15);
    this.jqueryElement.height(height);
    $("#notebook-tree").height(height - 31);
}

Bookshelf.prototype.selectNotebookAtIndex = function(index) {
    var notebookTreeData = $("#notebook-tree").tree("getTree").getData();
    if (notebookTreeData.length > 0) {
        var node = $("#notebook-tree").tree("getNodeByName", notebookTreeData[index].name);
        if (node) $("#notebook-tree").tree("selectNode", node);
    }
}
