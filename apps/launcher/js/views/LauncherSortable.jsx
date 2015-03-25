var __builtinAppClickTimer;
var __userAppClickTimer;
var __longPressTimer;
var cloneWithProps = React.addons.cloneWithProps;

var LauncherSortable = React.createClass({
    getDefaultProps: function() {
        return { component: "ul", childComponent: "li" };
    },

    propTypes: {
        manageable: React.PropTypes.bool
    },

    render: function() {
        var props = jQuery.extend({}, this.props);
        delete props.children;
        return React.createElement(this.props.component, props);
    },

    componentDidMount: function() {
        $(this.getDOMNode()).sortable({stop: this._handleDrop});
        $(this.getDOMNode()).disableSelection();
    },

    componentDidUpdate: function() {
        var childIndex = 0;
        var nodeIndex = 0;
        var children = this.getChildren();
        var nodes = $(this.getDOMNode()).children();
        var numChildren = children.length;
        var numNodes = nodes.length;

        while (childIndex < numChildren) {
            if (nodeIndex >= numNodes) {
                $(this.getDOMNode()).append('<' + this.props.childComponent + '/>');
                var appType = children[childIndex].props.appType;
                var node = $(this.getDOMNode()).children().last()[0];

                node.manifest    = children[childIndex].props.manifest;
                node.onmousedown = (appType === 'b') ? this._handleMouseDown_b : this._handleMouseDown_u;
                node.onmouseup   = (appType === 'b') ? this._handleMouseUp_b   : this._handleMouseUp_u;
                node.onmousemove = (appType === 'b') ? this._handleMouseMove_b : this._handleMouseMove_u;
                node.onclick     = this._handleDefaultClick;

                nodes.push(node);
                nodes[numNodes].dataset.reactSortablePos = numNodes;
                numNodes++;
            }
            var child = cloneWithProps(children[childIndex]);
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
            $(this.getDOMNode()).sortable('enable');
        else
            $(this.getDOMNode()).sortable('disable');
    },

    componentWillUnmount: function() {
        $(this.getDOMNode()).children().get().forEach(function(node) {
            React.unmountComponentAtNode(node);
        });
    },

    getChildren: function() {
        // TODO: use mapChildren()
        return this.props.children || [];
    },

    _handleDrop: function() {
        var newOrder = $(this.getDOMNode()).children().get().map(function(child, i) {
            var rv = child.dataset.reactSortablePos;
            child.dataset.reactSortablePos = i;
            return rv;
        });
        this.props.onSort(newOrder);
    },

    _handleMouseDown_b: function(e) {
        __builtinAppClickTimer = setTimeout(function() {
            __builtinAppClickTimer = undefined;
        }, 500);
        this._startManageModeTimer();
    },

    _handleMouseUp_b: function(e) {
        if (__builtinAppClickTimer) {
            e.stopPropagation();
            if (this.props.manageable) {
                e.preventDefault();
            }
        }
        this._stopManageModeTimer();
    },

    _handleMouseMove_b: function(e) {
        clearTimeout(__builtinAppClickTimer);
        __builtinAppClickTimer = undefined;
        this._stopManageModeTimer();
    },

    _handleMouseDown_u: function(e) {
        __userAppClickTimer = setTimeout(function() {
            __userAppClickTimer = undefined;
        }, 500);
        this._startManageModeTimer();
    },

    _handleMouseUp_u: function(e) {
        if (__userAppClickTimer) {
            e.stopPropagation();
            if (this.props.manageable) {
                var dir = e.target.id.split('-').pop();
                this.props.onUninstall(dir);
            }
        }
        this._stopManageModeTimer();
    },

    _handleMouseMove_u: function(e) {
        clearTimeout(__userAppClickTimer);
            __userAppClickTimer = undefined;
        this._stopManageModeTimer();
    },

    _handleDefaultClick: function(e) {
        if (this.props.manageable) {
            e.preventDefault();
            e.stopPropagation();
        }
    },

    _startManageModeTimer: function() {
        if (!this.props.manageable) {
            __longPressTimer = setTimeout(function() {
                this.props.onLongPressIcon();
            }.bind(this), 750);
        }
    },

    _stopManageModeTimer: function() {
        if (__longPressTimer)
            clearTimeout(__longPressTimer);
    }
});

module.exports = LauncherSortable;
