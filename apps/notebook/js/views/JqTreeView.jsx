var JqTreeView = React.createClass({

    propTypes: {
        data:              React.PropTypes.array.isRequired,
        exclusives:        React.PropTypes.array,
        onInit:            React.PropTypes.func,
        onOpen:            React.PropTypes.func,
        onClose:           React.PropTypes.func,
        onSelect:          React.PropTypes.func,
        onMove:            React.PropTypes.func,
        onCreateNewFolder: React.PropTypes.func
    },

    getDefaultProps: function() {
        return {
            onInit:   function() {},
            onOpen:   function(node) {},
            onClose:  function(node) {},
            onSelect: function(node) {},
            onMove:   function(moveInfo) {},
            onCreateNewFolder: function(createFolder) {
                createFolder('NewFolder' + Math.floor(Math.random() * 100).toString());
            }
        };
    },

    getInitialState: function() {
        return {

        };
    },

    componentDidMount: function() {
        this.treeInstance = $(this.getDOMNode());

        this.treeInstance.bind("tree.init", function() {
            //self.selectNotebookAtIndex(0);
            this.props.onInit();
        }.bind(this));

        this.treeInstance.bind("tree.open", function(event) {
            this.props.onOpen(event.node);
        }.bind(this));

        this.treeInstance.bind("tree.close", function(event) {
            this.props.onClose(event.node);
        }.bind(this));

        this.treeInstance.bind("tree.refresh", function() {
            //updateHoverHandler();
        }.bind(this));

        this.treeInstance.bind("tree.select", function(event) {
            console.log('select ' + event.node.name);
            if (event.node) {
                this.props.onSelect(event.node);
            }
        }.bind(this));

        this.treeInstance.bind("tree.move", function(event) {
            event.preventDefault();

            var movedNode = event.move_info.moved_node;
            var movedNodeParent = event.move_info.previous_parent;
            var targetNode = event.move_info.target_node;
            var position = event.move_info.position;

            if (this._isExclusiveNode(movedNode) || this._isExclusiveNode(targetNode))
                return;

            if (movedNode.isFolder() && (position === "inside" || (position !== "inside" && targetNode.getLevel() > 1)))
                return;

            if (movedNode.isParentOf(targetNode))
                return;

            if (targetNode.getLevel() > 1) {
                /* Move node to existing stack, do not create second level folder */
                if (position === "inside")
                    position = "after";
                this._nodeMove(movedNode, targetNode, position);
            }
            else if (targetNode.isFolder() || position !== "inside") {
                /* Move node to root level */
                this._nodeMove(movedNode, targetNode, position);
            }
            else {
                /* Create a new folder and move movedNote & targetNode to the folder */
                var name = this.props.onCreateNewFolder(function(name) {
                    this._nodeCreate(name);
                    var _folderNode = this._getNodeByName(name);
                    this._nodeMove(targetNode, _folderNode, "inside");
                    this._nodeMove(movedNode, _folderNode, "inside");
                    this._nodeOpen(_folderNode);

                    if (movedNodeParent && movedNodeParent.children.length === 0)
                        this._nodeRemove(movedNodeParent, true);
                }.bind(this));

                return;
            }

            if (movedNodeParent && movedNodeParent.children.length === 0) {
                this._nodeRemove(movedNodeParent, true);
            }
        }.bind(this));

        this.treeInstance.bind("tree.click", function(event) {
            // The clicked node is "event.node"
        }.bind(this));

        this.treeInstance.tree({
            closedIcon: $("<i class='inverted caret right icon'></i>"),
            openedIcon: $("<i class='inverted caret down icon'></i>"),
            nodeIcon:   $("<i class='inverted book icon'></i>"),
            onCreateLi: function(node, $li) {
                if (node.isFolder())
                    $li.find(".jqtree-title").before("<i class='list icon'></i>&nbsp;");
            },
            toggleable: false,
            dragAndDrop: true,
            autoOpen: false,
            data: this.props.data
        });
    },

    shouldComponentUpdate: function(nextProps, nextState) {
        this.treeInstance.tree("loadData", nextProps.data);
        return false;
    },

    render: function() {
        return (
            <div className="jq-treeview" />
        );
    },

    _isExclusiveNode: function(node) {
        for (var i in this.props.exclusiveNodes) {
            if (this.props.exclusiveNodes[i] === node.name)
                return true;
        }
        return false;
    },

    _nodeOpen: function(node) {
        this.treeInstance.tree("openNode", node, true);
    },

    _nodeSelect: function(node) {
        this.treeInstance.selectedNode = node;
        this.treeInstance.tree("selectNode", node);
    },

    _nodeMove: function(srcNode, dstNode, pos) {
        this.treeInstance.tree("moveNode", srcNode, dstNode, pos);
    },

    _nodeCreate: function(name) {
        this.treeInstance.tree("appendNode", { label: name });
    },

    _nodeRemove: function(node, isEmptyFolder) {
        var nextNodeToSelect = node.getNextSibling() || node.getPreviousSibling();

        if (isEmptyFolder) {
            /* Do nothing but remove node */
        }
        else if (node.isFolder()) {
            node.iterate(function(node) {
                //
                return true;
            });
        }
        else {
            //
        }

        this.treeInstance.tree("removeNode", node);
    },

    _nodeRename: function(node, name) {
        this.treeInstance.tree("updateNode", node, name);
    },

    _getNodeByName: function(name) {
        return this.treeInstance.tree("getNodeByName", name);
    }

});

module.exports = JqTreeView;
