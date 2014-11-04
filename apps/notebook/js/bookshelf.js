function NotebookDialog(name, dialog, okayText, cancelText) {
    var self = this;

    this.name = name;
    this.checker = [];
    this.dialog = $(dialog);
    this.input = $(dialog + " .dialog-input-name");
    this.tips = $(dialog + " .validate-tips");
    this.doOkay = undefined;
    this.doCancel = undefined;

    var form, allFields = $([]).add(this.input);

    okayText = okayText || "Ok";
    cancelText = cancelText || "Cancel";

    function updateTips(t) {
        self.tips.text(t).addClass("ui-state-highlight");
        setTimeout(function() {
            self.tips.removeClass("ui-state-highlight", 1500);
        }, 300);
    }

    function checkLength(o, n, min, max) {
        if (o.val().length > max || o.val().length < min) {
            o.addClass("ui-state-error");
            updateTips("Length of " + n + " must be between " + min + " and " + max + ".");
            return false;
        } else {
            return true;
        }
    }

    function checkRegexp(o, regexp, n) {
        if (regexp.test(o.val())) {
            o.addClass("ui-state-error");
            updateTips(n);
            return false;
        } else {
            return true;
        }
    }

    function checkOthers(o) {
        for (var i in self.checker) {
            if (self.checker[i].func(o.val())) {
                o.addClass("ui-state-error");
                var msg = self.checker[i].msg.replace(/#name/g, o.val());
                updateTips(msg);
                return false;
            }
        }
        return true;
    }

    this.dialog.dialog({
        autoOpen: false,
        height: 150,
        width: 400,
        modal: true,
        buttons: [
            {
                text: okayText,
                click: create
            },
            {
                text: cancelText,
                click: function() {
                    self.doCancel && self.doCancel();
                    self.tips.text("");
                    self.dialog.dialog("option", "height", 150);
                    self.dialog.dialog("close");
                }
            }
        ],
        close: function() {
            form[0].reset();
            allFields.removeClass("ui-state-error");
        }
    });

    form = this.dialog.find("form").on("submit", function(event) {
        event.preventDefault();
        create();
    });

    function create() {
        var valid = true;
        allFields.removeClass("ui-state-error");

        valid = valid && checkLength(self.input, self.name.toLowerCase() + " name", 2, 32);
        valid = valid && checkRegexp(self.input, /[`~,<>;':"/[\]|{}()=+!@#$%^&*]/, self.name + " should not consist of special characters");
        valid = valid && checkRegexp(self.input, /^(?=-|\.)/, self.name + " name should not begin with character '-' or '.'");
        valid = valid && checkRegexp(self.input, /.*(-|\.)$/, self.name + " name should not end with character '-' or '.'");
        valid = valid && checkOthers(self.input);

        if (valid) {
            self.doOkay && self.doOkay(self.input.val());
            self.tips.text("");
            self.dialog.dialog("option", "height", 150);
            self.dialog.dialog("close");
        }
        else {
            self.dialog.dialog("option", "height", 210);
        }

        return valid;
    }
}

NotebookDialog.prototype.open = function() {
    this.dialog.dialog("open");
};

NotebookDialog.prototype.close = function() {
    this.dialog.dialog("close");
};

NotebookDialog.prototype.onCreateClick = function(func) {
    this.doOkay = func;
};

NotebookDialog.prototype.onCancelClick = function(func) {
    this.doCancel = func;
};

NotebookDialog.prototype.addCustomCheck = function(func, msg) {
    this.checker.push({ func: func, msg: msg });
};



function Bookshelf(fileManager) {
    var self = this;

    this.treeData = [];
    this.fileManager = fileManager;

    /* Initialize Dialogs */
    var checkDuplicateStack = function(name) {
        var node = $('#notebook-tree').tree('getNodeByName', name);
        if (node && node.isFolder())
            return true;
    };

    var checkDuplicateNotebook = function(name) {
        var node = $('#notebook-tree').tree('getNodeByName', name);
        if (node && !node.isFolder())
            return true;
    };

    var createNotebookDialog = new NotebookDialog("Notebook", "#create-nb-dialog", "Create");
    var renameNotebookDialog = new NotebookDialog("Notebook", "#rename-nb-dialog", "Rename");
    var createStackDialog = new NotebookDialog("Stack", "#create-nb-stack-dialog", "Create");

    createStackDialog.addCustomCheck(checkDuplicateStack, "There is already a stack named '#name'");
    createNotebookDialog.addCustomCheck(checkDuplicateNotebook, "There is already a notebook named '#name'");
    renameNotebookDialog.addCustomCheck(checkDuplicateNotebook, "There is already a notebook named '#name'");

    function showRenameDialog(name, type) {
        var node = $('#notebook-tree').tree('getNodeByName', name);

        renameNotebookDialog.onCreateClick(function(newName) {
            //alert("Rename " + node.name + " at level " + node.getLevel() + " parent " + node.parent.name);
            $('#bookshelf').trigger('update', { node: node, name: newName });
        });

        renameNotebookDialog.open();
    }

    function showDeleteConfirm(name, type) {
        var node = $('#notebook-tree').tree('getNodeByName', name);
        var parent = node.parent;
        //alert("Delete " + node.name + " at level " + node.getLevel() + " parent " + node.parent.name);
        $('#bookshelf').trigger('delete', { node: node });
        if (parent.children.length === 0) {
            $('#bookshelf').trigger('delete', { node: parent });
        }
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
        $('ul.jqtree-tree li > .jqtree-element').hover(
            function() {
                var idx = $('ul.jqtree-tree li > .jqtree-element').index(this);
                var name = $(this).find("span.jqtree-title").text();
                var type;
                if ($(this).find("span.jqtree-title-folder"))
                    type = 'stack';
                else
                    type = 'notebook';

                $(this).find("span.action-button").remove();
                $(this).append($(
                    "<span id='notebook-down-btn-" + idx + "' class='action-button'>" +
                    "<a href='#'><i class='fa fa-caret-square-o-down'></i>&nbsp;</a>" +
                    "</span>"));

                var showMenu = function(event) {
                    event.stopPropagation();
                    event.preventDefault();

                    var element = event.target;
                    if (element.id === 'notebook-tree') {
                        element = $('#notebook-down-btn-' + idx);
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
                            "<ul id='popup-menu' style='position:absolute;z-index:9999;'>" +
                            "<li class='ui-state-disabled'>Copy</li>" +
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

                        if (selectedOption === "Copy")
                            alert('Copy');
                        else if (selectedOption === "Rename")
                            showRenameDialog(name, type);
                        else if (selectedOption === "Delete")
                            showDeleteConfirm(name, type);
                    });
                };

                $('#notebook-tree').unbind('tree.contextmenu');
                $('#notebook-tree').bind('tree.contextmenu', showMenu);
                $('#notebook-down-btn-' + idx + ' a').click(showMenu);
            },
            function() {
                $(this).find("span.action-button").remove();
            }
        );
    }

    $('#all-notebook-down-btn a').click(function(event) {
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
                createNotebookDialog.onCreateClick(function(name) {
                    $('#bookshelf').trigger('create', { name: name, type: 'notebook' });
                });

                createNotebookDialog.open();
            }
        });
    });

    $(document).on('click', function(e) {
        var $target = $(e.target);

        if (!$target.attr('id') || $target.attr('id') !== 'all-notebook-down-btn')
            allNotebooksPopupMenu.hide();

        if (!$target.attr('id') || $target.attr('id').indexOf('notebook-down-btn-') !== 0)
            lastNotebookPopupMenu && lastNotebookPopupMenu.hide();
    });

    /* Build real path from node or string */
    var getPath = function(node) {
        var path = '';

        if (typeof node === 'object')
            path = '/' + node.name;
        else if (typeof node === 'string')
            path = node;

        return 'bookshelf' + path;
    }

    /* Initialize notebook tree */
    $('#notebook-tree').bind('tree.open', function(event) {
        $('#bookshelf').trigger('open', { node: event.node });
    });

    $('#notebook-tree').bind('tree.close', function(event) {
        $('#bookshelf').trigger('close', { node: event.node });
    });

    $('#notebook-tree').bind('tree.refresh', function() {
        updateHoverHandler();
        $('#bookshelf').trigger('loaded', { treeData: self.treeData });
    });

    $('#notebook-tree').bind('tree.select', function(event) {
        $('#bookshelf').trigger('select', { node: event.node });
    });

    $('#notebook-tree').bind('tree.move', function(event) {
        event.preventDefault();

        var movedNode = event.move_info.moved_node;
        var movedNodeParent = event.move_info.previous_parent;
        var targetNode = event.move_info.target_node;
        var position = event.move_info.position;

        if (movedNode.isFolder() && (position === 'inside' || (position !== 'inside' && targetNode.getLevel() > 1)))
            return;

        if (movedNode.isParentOf(targetNode))
            return;

        if (targetNode.getLevel() > 1) {
            /* Move node to existing stack, do not create second level folder */
            if (position === 'inside')
                position = 'after';
            $('#bookshelf').trigger('move', { srcNode: movedNode, dstNode: targetNode, pos: position });
        }
        else if (targetNode.isFolder() || position !== 'inside') {
            /* Move node to root level */
            $('#bookshelf').trigger('move', { srcNode: movedNode, dstNode: targetNode, pos: position });
        }
        else {
            /* Create a new stack and move movedNote & targetNode to the stack */
            createStackDialog.onCreateClick(function(name) {
                $('#bookshelf').trigger('create', { name: name, type: 'stack' });

                var stackNode = $('#notebook-tree').tree('getNodeByName', name);
                $('#bookshelf').trigger('move', { srcNode: targetNode, dstNode: stackNode, pos: 'inside' });
                $('#bookshelf').trigger('move', { srcNode: movedNode, dstNode: stackNode, pos: 'inside' });
                $('#notebook-tree').tree('openNode', stackNode, true);

                if (movedNodeParent.children.length === 0) {
                    $('#bookshelf').trigger('delete', { node: movedNodeParent });
                }
            });

            createStackDialog.open();
            return;
        }

        if (movedNodeParent.children.length === 0) {
            $('#bookshelf').trigger('delete', { node: movedNodeParent });
        }
    });

    $('#notebook-tree').bind('tree.click', function(event) {
        // The clicked node is 'event.node'
    });

    /* Create and initialize tree */
    var initNotebookTree = function() {
        /* Initialize notebook tree */
        $('#notebook-tree').tree({
            closedIcon: $('<i class="fa fa-caret-right"></i>'),
            openedIcon: $('<i class="fa fa-caret-down"></i>'),
            nodeIcon: $('<i class="fa fa-book"></i>'),
            onCreateLi: function(node, $li) {
                if (node.isFolder())
                    $li.find('.jqtree-title').before('<i class="fa fa-list"></i>&nbsp;');
            },
            toggleable: false,
            dragAndDrop: true,
            autoOpen: false,
            data: self.treeData
        });

        updateHoverHandler();
    }

    /* Save notebook tree to bookshelf-tree.json */
    var saveTreeData = function() {
        var treeData = $('#notebook-tree').tree('toJson');
        self.fileManager.writeFile("bookshelf-tree.json", treeData, function(path, error) {
            if (error) throw new Error("Unable to write bookshelf tree data");
        });
    }

    /* Handle notebook tree events */
    $('#bookshelf').on('open', function(event, arg) {
        saveTreeData();
    });

    $('#bookshelf').on('close', function(event, arg) {
        saveTreeData();
    });

    $('#bookshelf').on('create', function(event, arg) {
        if (arg.type === 'notebook') {
            var path = getPath('/') + arg.name;
            //console.log('create ' + path);

            self.fileManager.exist(path, function(path, exist, isDir, error) {
                if (error) throw new Error('fs operation error');
                if (exist) throw new Error(path + ' already exists');

                self.fileManager.createDirectory(path, function(path, error) {
                    if (error) throw new Error('unable to create ' + path);
                });
            });
        }

        $('#notebook-tree').tree('appendNode', { label: arg.name });
        saveTreeData();
    });

    $('#bookshelf').on('update', function(event, arg) {
        if (!arg.node.isFolder()) {
            var src = getPath(arg.node);
            var dst = getPath('/') + arg.name;

            //console.log('move ' + src + ' to ' + dst);

            self.fileManager.move(src, dst, function(src, dst, error) {
                if (error) throw new Error('unable to move ' + src + ' to ' + dst);
            });
        }

        $('#notebook-tree').tree('updateNode', arg.node, arg.name);
        saveTreeData();
        updateHoverHandler();
    });

    $('#bookshelf').on('move', function(event, arg) {
        $('#notebook-tree').tree('moveNode', arg.srcNode, arg.dstNode, arg.pos);
        saveTreeData();
    });

    $('#bookshelf').on('delete', function(event, arg) {
        if (arg.node.isFolder()) {
            arg.node.iterate(function(node) {
                if (!node.isFolder()) {
                    self.fileManager.remove(getPath(node), function(path, error) {
                        if (error) throw new Error('unable to remove ' + path);
                    });
                }
                return true;
            });
        }
        else {
            self.fileManager.remove(getPath(arg.node), function(path, error) {
                if (error) throw new Error('unable to remove ' + path);
            });
        }

        $('#notebook-tree').tree('removeNode', arg.node);
        saveTreeData();
    });

    /* Initialize accordion at final step of UI initializion to fit tree column width */
    $('#accordion').accordion({
        heightStyle: "fill",
        collapsible: true,
        active: 1
    });

    /* Create /bookshelf if necessary */
    self.fileManager.exist(getPath(), function(path, exist, isDir, error) {
        if (error) throw new Error('fs operation error');

        if (!exist) {
            self.fileManager.createDirectory(getPath(), function(path, error) {
                if (error) throw new Error('unable to create /bookshelf');
            });
        }
        else if (exist && !isDir) {
            self.fileManager.remove(getPath(), function(path, error) {
                if (error) throw new Error('unable to remove /bookshelf');

                self.fileManager.createDirectory(getPath(), function(path, error) {
                    if (error) throw new Error('unable to create /bookshelf');
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
                    self.treeData = JSON.parse(data);
                    initNotebookTree();
                }
                catch (err) {
                    alert("Parse Tree Data " + err);
                }
            });
        }
        else {
            self.fileManager.writeFile("bookshelf-tree.json", self.treeData, function(path, error) {
                if (error) throw new Error("Unable to write bookshelf tree data");
                initNotebookTree();
            });
        }
    });
}

Bookshelf.prototype.fitSize = function(width, height) {
    $("#bookshelf").width(width * 0.15);
    $("#bookshelf").height(height);
    $("#bookmark-list").height(height - 86);
    $("#notebook-tree").height(height - 60);
}
