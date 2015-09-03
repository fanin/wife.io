export default class LauncherSortable extends React.Component {

  static propTypes = {
    manageable: React.PropTypes.bool
  };

  static defaultProps = {
    manageable: false,
    component: "ul",
    childComponent: "li"
  };

  constructor(props) {
    super(props);
    this.state = {
      dataSource: [],
      selectedRowIndex: -1,
      disabled: false
    };
    this.builtinAppClickTimer = null;
    this.userAppClickTimer = null;
    this.longPressTimer = null;
  }

  componentDidMount() {
    $(React.findDOMNode(this)).sortable({ stop: this.handleDrop.bind(this) });
    $(React.findDOMNode(this)).disableSelection();
  }

  componentDidUpdate() {
    var childIndex = 0;
    var nodeIndex = 0;
    var children = this.getChildren();
    var nodes = $(React.findDOMNode(this)).children();
    var numChildren = children.length;
    var numNodes = nodes.length;

    while (childIndex < numChildren) {
      if (nodeIndex >= numNodes) {
        $(React.findDOMNode(this)).append('<' + this.props.childComponent + '/>');
        var appType = children[childIndex].props.appType;
        var node = $(React.findDOMNode(this)).children().last()[0];

        node.manifest = children[childIndex].props.manifest;
        node.onmousedown = (appType === 'ia')
                            ? this.handleMouseDown_ia.bind(this)
                            : this.handleMouseDown_ua.bind(this);
        node.onmouseup = (appType === 'ia')
                            ? this.handleMouseUp_ia.bind(this)
                            : this.handleMouseUp_ua.bind(this);
        node.onmousemove = (appType === 'ia')
                            ? this.handleMouseMove_ia.bind(this)
                            : this.handleMouseMove_ua.bind(this);
        node.onclick = this.handleDefaultClick.bind(this);

        nodes.push(node);
        nodes[numNodes].dataset.reactSortablePos = numNodes;
        numNodes++;
      }
      var child = React.cloneElement(children[childIndex]);
      React.render(child, nodes[nodeIndex]);
      childIndex++;
      nodeIndex++;
    }

    while (nodeIndex < numNodes) {
      React.unmountComponentAtNode(nodes[nodeIndex]);
      $(nodes[nodeIndex]).remove();
      nodeIndex++;
    }

    if (this.props.manageable)
      $(React.findDOMNode(this)).sortable('enable');
    else
      $(React.findDOMNode(this)).sortable('disable');
  }

  componentWillUnmount() {
    $(React.findDOMNode(this)).children().get().forEach((node) => {
      React.unmountComponentAtNode(node);
    });
  }

  getChildren() {
    return this.props.children || [];
  }

  handleDrop() {
    var newOrder = $(React.findDOMNode(this)).children().get().map((child, i) => {
      let rv = child.dataset.reactSortablePos;
      child.dataset.reactSortablePos = i;
      return rv;
    });
    this.props.onSort(newOrder);
  }

  handleMouseDown_ia(e) {
    this.builtinAppClickTimer = setTimeout(() => {
      this.builtinAppClickTimer = undefined;
    }, 500);
    this.startManageModeTimer();
  }

  handleMouseUp_ia(e) {
    if (this.builtinAppClickTimer) {
      e.stopPropagation();
      if (this.props.manageable) {
        e.preventDefault();
      }
    }
    this.stopManageModeTimer();
  }

  handleMouseMove_ia(e) {
    clearTimeout(this.builtinAppClickTimer);
    this.builtinAppClickTimer = undefined;
    this.stopManageModeTimer();
  }

  handleMouseDown_ua(e) {
    this.userAppClickTimer = setTimeout(() => {
      this.userAppClickTimer = undefined;
    }, 500);
    this.startManageModeTimer();
  }

  handleMouseUp_ua(e) {
    if (this.userAppClickTimer) {
      e.stopPropagation();
      if (this.props.manageable) {
        var appid = e.target.id.split('-').pop();
        this.props.onUninstall(appid);
      }
    }
    this.stopManageModeTimer();
  }

  handleMouseMove_ua(e) {
    clearTimeout(this.userAppClickTimer);
    this.userAppClickTimer = undefined;
    this.stopManageModeTimer();
  }

  handleDefaultClick(e) {
    if (this.props.manageable) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  startManageModeTimer() {
    if (!this.props.manageable) {
      this.longPressTimer = setTimeout(() => {
        this.props.onLongPressIcon();
      }, 750);
    }
  }

  stopManageModeTimer() {
    if (this.longPressTimer)
      clearTimeout(this.longPressTimer);
  }

  render() {
    var props = jQuery.extend({}, this.props);
    delete props.children;
    return React.createElement(this.props.component, props);
  }
}
