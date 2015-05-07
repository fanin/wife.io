var ListViewItem = require('./ListViewItem.jsx')

var ListViewController = React.createClass({

    propTypes: {
        setDataSourceByRef: React.PropTypes.bool,
        onDataLoad: React.PropTypes.func,
        onSelectRow: React.PropTypes.func
    },

    getDefaultProps: function() {
        return {
            setDataSourceByRef: false
        };
    },

    getInitialState: function() {
        return {
            dataSource: [],
            selectedRowIndex: 0
        };
    },

    render: function() {
        var rows = this.state.dataSource.map(function(data, index) {
            var isActive = (index == this.state.selectedRowIndex);
            return <ListViewItem index={index}
                                active={isActive}
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

    setDataSource: function(dataList) {
        this.setState({ dataSource: (this.props.setDataSourceByRef ? dataList : dataList.slice(0)) });
        this.props.onDataLoad && this.props.onDataLoad();
    },

    selectRowAtIndex: function(index) {
        this.setState({ selectedRowIndex: index });
        if (this.props.setDataSourceByRef)
            this.forceUpdate();
        this.props.onSelectRow && this.props.onSelectRow(index);
        this.scrollToRowAtIndex(index, true);
    },

    addRowAtIndex: function(data, index) {
        if (!this.props.setDataSourceByRef) {
            var dataSource = this.state.dataSource;
            dataSource.splice(index, 0, data);
            dataSource.join();
            this.setState({ dataSource: dataSource });
        }

        this.selectRowAtIndex(index);
    },

    removeRowAtIndex: function(index) {
        if (!this.props.setDataSourceByRef) {
            var dataSource = this.state.dataSource;
            dataSource.splice(index, 1);
            this.setState({ dataSource: dataSource });
        }

        if (index >= this.state.dataSource.length)
            this.selectRowAtIndex(this.state.dataSource.length - 1);
        else
            this.selectRowAtIndex(index);
    },

    scrollToRowAtIndex: function(index, animated) {
        var _containerHeight = $(".cutie-listview-container").height();
        var _rowHeight = $( $(".ui.selection.celled.list").children().eq(index) ).outerHeight();
        var _containerMiddlePos = _containerHeight / 2 - _rowHeight / 2;
        var _posScrollTo = (_rowHeight * index) - _containerMiddlePos;

        if (animated)
            $(".cutie-listview-container").stop(true, true).animate({
                scrollTop: _posScrollTo
            }, 600);
        else
            $(".cutie-listview-container").scrollTop(_posScrollTo);
    }

});

module.exports = ListViewController;
