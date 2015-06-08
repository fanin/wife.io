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
            disabled: false
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
            action: "hide",
            onChange: _onChange
        };

        $(this.getDOMNode()).dropdown(_settings);
    },

    componentWillUpdate: function(nextProps, nextState) {
        if (nextState.disabled)
            $(this.getDOMNode()).addClass("disabled");
        else
            $(this.getDOMNode()).removeClass("disabled");
    },

    shouldComponentUpdate: function (nextProps, nextState) {
        return true;
    },

    render: function() {
        var items = this.props.itemDataSource.map(function(data) {
            return (
                <div className = {data.disabled ? "item disabled" : "item"}
                    data-value = {data.value}
                       onClick = {(this.state.disabled || data.disabled) ? null : data.onSelect}>
                    <i className={data.icon + " icon"} />
                    {data.text}
                </div>
            );
        }.bind(this));

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
