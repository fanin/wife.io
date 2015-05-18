'use strict';

var DropdownViewController = React.createClass({

    propTypes: {
        itemDataSource: React.PropTypes.array.isRequired
    },

    getDefaultProps: function() {
        return {
            iconClass: "",
            useSelectBar: true,
            onChange: function() {}
        };
    },

    getInitialState: function() {
        return {
            disable: false
        };
    },

    componentDidMount: function() {
        var _onChange = function(value, text, $selectedItem) {
            this.props.onChange(value, text);
        }.bind(this);

        var _settings = this.props.useSelectBar ? {
            transition: "drop",
            onChange: _onChange
        } : {
            transition: "drop",
            action: "nothing",
            onChange: _onChange
        };

        $(this.getDOMNode()).dropdown(_settings);
    },

    shouldComponentUpdate: function (nextProps, nextState) {
        return true;
    },

    componentWillUpdate: function(nextProps, nextState) {
        if (nextState.disable)
            $(this.getDOMNode()).addClass("disabled");
        else
            $(this.getDOMNode()).removeClass("disabled");
    },

    render: function() {
        var items = this.props.itemDataSource.map(function(data) {
            return (
                <div className="item" data-value={data.value} onClick={data.onSelect}>
                    <i className={data.icon + " icon"} />
                    {data.text}
                </div>
            );
        });

        var buttonIcon = this.props.iconClass ? <i className={this.props.iconClass + " icon"} /> : null;

        return (
            <div className="ui pointing dropdown link item">
                {buttonIcon}
                <div className="menu">
                    {items}
                </div>
            </div>
        );
    }

});

module.exports = DropdownViewController;
