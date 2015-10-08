export default class JqTreeViewController extends React.Component {

  static propTypes = {
    data:           React.PropTypes.array.isRequired,
    exclusives:     React.PropTypes.array.isRequired,
    onCreateNode:   React.PropTypes.func,
    onOpen:         React.PropTypes.func,
    onClose:        React.PropTypes.func,
    onSelect:       React.PropTypes.func,
    onMove:         React.PropTypes.func,
    onRefresh:      React.PropTypes.func,
    onCreateFolder: React.PropTypes.func
  };

  static defaultProps = {
    exclusives: [],
    onCreateNode: (node) => {},
    onTreeInit: () => {},
    onOpen: (node) => {},
    onClose: (node) => {},
    onSelect: (node) => {},
    onMove: (movedNode, targetNode, position) => {},
    onRefresh: () => {},
    onCreateFolder: (createFolderHelper) => {
      createFolderHelper(
        undefined,
        'NewFolder' + Math.floor(Math.random() * 100).toString()
      );
    }
  };

  componentDidMount() {
    this.treeInstance = $(React.findDOMNode(this));

    this.treeInstance.bind("tree.init", (event) => {
      this.props.onTreeInit();
    });

    this.treeInstance.bind("tree.open", (event) => {
      this.props.onOpen(event.node);
    });

    this.treeInstance.bind("tree.close", (event) => {
      this.props.onClose(event.node);
    });

    this.treeInstance.bind("tree.refresh", () => {
      this.props.onRefresh();
    });

    this.treeInstance.bind("tree.select", (event) => {
      event.node && this.props.onSelect(event.node);
    });

    this.treeInstance.bind("tree.move", (event) => {
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
        var name = this.props.onCreateFolder((id, name) => {
          this.nodeCreate(id, name);
          var _folderNode = this.getNodeById(id);
          this.nodeMove(targetNode, _folderNode, "inside");
          this.nodeMove(movedNode, _folderNode, "inside");
          this.nodeOpen(_folderNode);
          this.props.onMove(movedNode, targetNode, position);
        });
      }
    });

    this.treeInstance.tree({
      closedIcon:  $("<i class='inverted caret right icon'></i>"),
      openedIcon:  $("<i class='inverted caret down icon'></i>"),
      toggleable:  false,
      dragAndDrop: true,
      autoOpen:    false,
      data:        this.props.data,

      onCreateLi: (node, $li) => {
        if (node.isFolder())
          $li.find(".jqtree-title").before("<i class='list icon'/>&nbsp;");
        else
          $li.find(".jqtree-title").before("<i class='inverted book icon'/>&nbsp;");

        this.props.onCreateNode && this.props.onCreateNode(node);
      },

      onCanMove: (node) => {
        return !this.isExclusiveNode(node);
      },

      onCanMoveTo: (movedNode, targetNode, position) => {
        if (this.isExclusiveNode(targetNode) &&
            (position === "inside" || position === "before"))
          return false;

        if (movedNode.isFolder()
            && (position === "inside"
                || (position !== "inside" && targetNode.getLevel() > 1)))
          return false;

        if (movedNode.isParentOf(targetNode))
          return false;

        return true;
      }
    });
  }

  shouldComponentUpdate(nextProps, nextState) {
    /* Reload tree data only when data changes */
    if (this.props.data !== nextProps.data) {
      this.treeInstance.tree("loadData", nextProps.data);
    }
    return false;
  }

  isExclusiveNode(node) {
    for (var i in this.props.exclusives) {
      if (this.props.exclusives[i] === node.id
        || this.props.exclusives[i] === node.name
        || this.props.exclusives[i] === "*")
        return true;
    }
    return false;
  }

  getNodeById(id) {
    return this.treeInstance.tree("getNodeById", id);
  }

  getTree() {
    return this.treeInstance.tree("getTree");
  }

  getTreeData() {
    return this.treeInstance.tree("toJson");
  }

  getSelectedNode() {
    return this.treeInstance.tree("getSelectedNode");
  }

  nodeOpen(node) {
    this.treeInstance.tree("openNode", node, true);
  }

  nodeSelect(node) {
    this.treeInstance.tree("selectNode", node);
  }

  nodeCreate(id, name, pos, node) {
    var _newNode = { id: id, label: name};
    if (pos === "before" && node)
      this.treeInstance.tree("addNodeBefore", _newNode, node);
    else if (pos === "after" && node)
      this.treeInstance.tree("addNodeAfter", _newNode, node);
    else
      this.treeInstance.tree("appendNode", _newNode);
  }

  nodeRemove(node) {
    var parent = node.parent;
    this.treeInstance.tree("removeNode", node);
    if (parent && parent.children.length === 0)
      this.treeInstance.tree("removeNode", parent);
  }

  nodeRename(node, name) {
    this.treeInstance.tree("updateNode", node, name);
    /*
     * BUG (jqTree):
     * After 'updateNode', a ghost li will be inserted into wrong position
     * and cannot be removed after moving node.
     * This is probably caused by maintaining tree data failed after updating node.
     * So we reload tree data refreshly here to avoid the problem.
     */
    this.treeInstance.tree("loadData", JSON.parse(this.treeInstance.tree("toJson")));
    /* Select renamed node again due to tree has been reloaded */
    this.treeInstance.tree("selectNode", this.getNodeById(node.id));
  }

  nodeMove(srcNode, dstNode, pos) {
    var srcParent = srcNode.parent;
    this.treeInstance.tree("moveNode", srcNode, dstNode, pos);
    if (srcParent && srcParent.children.length === 0)
      this.treeInstance.tree("removeNode", srcParent);
  }

  render() {
    return (
      <div className="jq-treeview-container">
        <div className="jq-treeview" />
      </div>
    );
  }
}
