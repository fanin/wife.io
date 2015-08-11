var ListViewItem = require('./ListViewItem.jsx')

var ListViewController = React.createClass({

    propTypes: {
        canManageDataSource: React.PropTypes.bool,
        onDataLoad: React.PropTypes.func,
        onSelectRow: React.PropTypes.func,
        onRenderListViewItem: React.PropTypes.func
    },

    getDefaultProps: function() {
        return {
            canManageDataSource: false,
            onRenderListViewItem: function(data) { return data }
        };
    },

    getInitialState: function() {
        return {
            dataSource: [],
            selectedRowIndex: -1,
            disabled: false
        };
    },

    render: function() {
        var rows = this.state.dataSource.map(function(data, index) {
            var isActive = (index == this.state.selectedRowIndex);
            data = this.props.onRenderListViewItem(data);
            return <ListViewItem index={index}
                                   key={index}
                                active={isActive}
                              disabled={this.state.disabled}
                             titleText={data.titleText}
                          subtitleText={data.subtitleText}
                            detailText={data.detailText}
                              onSelect={this.selectRowAtIndex} />;
        }, this);

        return (
            <div className="cutie-listview-container">
                <div className="ui selection celled list">
                    {rows}
                </div>
            </div>
        );
    },

    setEnable: function(enable) {
        this.setState({ disabled: !enable });
    },

    setDataSource: function(dataList) {
        this.setState({ dataSource: dataList });
        this.props.onDataLoad && this.props.onDataLoad();
    },

    count: function() {
        return this.state.dataSource.length;
    },

    selectRowAtIndex: function(index) {
        this.setState({ selectedRowIndex: index });
        if (!this.props.canManageDataSource)
            this.forceUpdate();
        this.props.onSelectRow && this.props.onSelectRow(index);
        this.scrollToRowAtIndex(index, true);
    },

    addRowAtIndex: function(data, index) {
        if (this.props.canManageDataSource) {
            var dataSource = this.state.dataSource;
            dataSource.splice(index, 0, data);
            dataSource.join();
            this.setState({ dataSource: dataSource });
        }

        this.selectRowAtIndex(index);
    },

    removeRowAtIndex: function(index) {
        if (this.props.canManageDataSource) {
            var dataSource = this.state.dataSource;
            dataSource.splice(index, 1);
            this.setState({ dataSource: dataSource });
        }

        if (index >= this.state.dataSource.length)
            this.selectRowAtIndex(this.state.dataSource.length - 1);
        else
            this.selectRowAtIndex(index);
    },

    refresh: function(index) {
        this.forceUpdate();
    },

    scrollToRowAtIndex: function(index, animated) {
        var _containerHeight = $(".cutie-listview-container").height();
        var _rowHeight = $( $(".ui.selection.celled.list").children().eq(index) ).outerHeight();
        var _containerScrollToPos = _containerHeight / 3 - _rowHeight / 2;
        var _posScrollTo = (_rowHeight * index) - _containerScrollToPos;

        if (animated)
            $(".cutie-listview-container").stop(true, true).animate({
                scrollTop: _posScrollTo
            }, 600);
        else
            $(".cutie-listview-container").scrollTop(_posScrollTo);
    }

});

module.exports = ListViewController;
