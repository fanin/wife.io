var JqTreeViewController = React.createClass({

    propTypes: {
        data:           React.PropTypes.array.isRequired,
        exclusives:     React.PropTypes.array.isRequired,
        onOpen:         React.PropTypes.func,
        onClose:        React.PropTypes.func,
        onSelect:       React.PropTypes.func,
        onMove:         React.PropTypes.func,
        onRefresh:      React.PropTypes.func,
        onCreateFolder: React.PropTypes.func
    },

    getDefaultProps: function() {
        return {
            exclusives:     [],
            onOpen:         function(node) {},
            onClose:        function(node) {},
            onSelect:       function(node) {},
            onMove:         function(movedNode, targetNode, position) {},
            onRefresh:      function() {},
            onCreateFolder: function(createFolderHelper) {
                createFolderHelper(undefined, 'NewFolder' + Math.floor(Math.random() * 100).toString());
            }
        };
    },

    getInitialState: function() {
        return {

        };
    },

    componentDidMount: function() {
        this.treeInstance = $(this.getDOMNode());

        this.treeInstance.bind("tree.open", function(event) {
            this.props.onOpen(event.node);
        }.bind(this));

        this.treeInstance.bind("tree.close", function(event) {
            this.props.onClose(event.node);
        }.bind(this));

        this.treeInstance.bind("tree.refresh", function() {
            this.props.onRefresh();
        }.bind(this));

        this.treeInstance.bind("tree.select", function(event) {
            if (event.node) {
                this.props.onSelect(event.node);
            }
        }.bind(this));

        this.treeInstance.bind("tree.move", function(event) {
            event.preventDefault();

            var movedNode = event.move_info.moved_node;
            var targetNode = event.move_info.target_node;
            var position = event.move_info.position;

            if (targetNode.getLevel() > 1) {
                /* Move node to existing stack, do not create second level folder */
                if (position === "inside")
                    position = "after";
                this.nodeMove(movedNode, targetNode, position);
                this.props.onMove(movedNode, targetNode, position);
            }
            else if (targetNode.isFolder() || position !== "inside") {
                /* Move node to root level */
                this.nodeMove(movedNode, targetNode, position);
                this.props.onMove(movedNode, targetNode, position);
            }
            else {
                /* Create a new folder and move movedNote & targetNode to the folder */
                var name = this.props.onCreateFolder(function(id, name) {
                    this.nodeCreate(id, name);
                    var _folderNode = this.getNodeById(id);
                    this.nodeMove(targetNode, _folderNode, "inside");
                    this.nodeMove(movedNode, _folderNode, "inside");
                    this.nodeOpen(_folderNode);
                    this.props.onMove(movedNode, targetNode, position);
                }.bind(this));
            }
        }.bind(this));

        this.treeInstance.tree({
            closedIcon:  $("<i class='inverted caret right icon'></i>"),
            openedIcon:  $("<i class='inverted caret down icon'></i>"),
            toggleable:  false,
            dragAndDrop: true,
            autoOpen:    false,
            data:        this.props.data,

            onCreateLi:  function(node, $li) {
                if (node.isFolder())
                    $li.find(".jqtree-title").before("<i class='list icon'></i>&nbsp;");
                else
                    $li.find(".jqtree-title").before("<i class='inverted book icon'></i>&nbsp;");
            },

            onCanMove:   function(node) {
                return !this._isExclusiveNode(node);
            }.bind(this),

            onCanMoveTo: function(movedNode, targetNode, position) {
                if (this._isExclusiveNode(targetNode) &&
                        (position === "inside" || position === "before"))
                    return false;

                if (movedNode.isFolder() &&
                        (position === "inside" || (position !== "inside" && targetNode.getLevel() > 1)))
                    return false;

                if (movedNode.isParentOf(targetNode))
                    return false;

                return true;
            }.bind(this)
        });
    },

    shouldComponentUpdate: function(nextProps, nextState) {
        /* Load tree data initially */
        if (this.treeInstance.tree("getTree").children.length === 0) {
            this.treeInstance.tree("loadData", nextProps.data);
            /* Select first node by default */
            this.nodeSelect(this.treeInstance.tree("getTree").children[0]);
        }
        return false;
    },

    render: function() {
        return (
            <div className="jq-treeview" />
        );
    },

    _isExclusiveNode: function(node) {
        for (var i in this.props.exclusives) {
            if (this.props.exclusives[i] === node.id || this.props.exclusives[i] === node.name)
                return true;
        }
        return false;
    },

    getNodeById: function(id) {
        return this.treeInstance.tree("getNodeById", id);
    },

    getTreeData: function() {
        return this.treeInstance.tree("toJson");
    },

    getSelectedNode: function() {
        return this.treeInstance.tree("getSelectedNode");
    },

    nodeOpen: function(node) {
        this.treeInstance.tree("openNode", node, true);
    },

    nodeSelect: function(node) {
        this.treeInstance.tree("selectNode", node);
    },

    nodeCreate: function(id, name) {
        this.treeInstance.tree("appendNode", { label: name, id: id });
    },

    nodeRemove: function(id) {
        var node = this.getNodeById(id);
        var parent = node.parent;
        this.treeInstance.tree("removeNode", node);
        if (parent && parent.children.length === 0)
            this.treeInstance.tree("removeNode", parent);
    },

    nodeRename: function(node, name) {
        this.treeInstance.tree("updateNode", node, name);
        /*
         * BUG (jqTree):
         * After 'updateNode', a ghost li will be inserted into wrong position and cannot be removed after moving node.
         * This is probably caused by maintaining tree data failed after updating node.
         * So we reload tree data refreshly here to avoid the problem.
         */
        this.treeInstance.tree("loadData", JSON.parse(this.treeInstance.tree("toJson")));
    },

    nodeMove: function(srcNode, dstNode, pos) {
        var srcParent = srcNode.parent;
        this.treeInstance.tree("moveNode", srcNode, dstNode, pos);
        if (srcParent && srcParent.children.length === 0)
            this.treeInstance.tree("removeNode", srcParent);
    }

});

module.exports = JqTreeViewController;
