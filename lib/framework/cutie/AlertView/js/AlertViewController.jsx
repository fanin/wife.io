'use strict';

var AlertViewController = React.createClass({
    getDefaultProps: function() {
        return {
            title: "",
            image: "",
            message: "",
            customViewComponent: null,
            actionButtons: [],
            actionButtonsAlign: "right"
        };
    },

    show: function() {
        if (!this.modalInstance)
            this.modalInstance = $(this.getDOMNode()).modal({
                closable: false,
                detachable: false
            });

        this.modalInstance.modal('show');
    },

    hide: function() {
        this.modalInstance.modal('hide');
    },

    componentDidMount: function () {
        $(this.getDOMNode()).find(".actions").css("text-align", this.props.actionButtonsAlign);
    },

    componentWillUnmount: function () {
        if (this.modalInstance) {
            this.modalInstance.modal('destroy');
        }
    },

    render: function() {
        var image = this.props.image ? <div className="image">{this.props.image}</div> : null;

        var actionButtons = this.props.actionButtons.map(function(button) {
            var buttonClass = "ui " + (button.iconType ? "center labeled " : "center ") + "icon " + button.color + " button " + button.actionType;
            var buttonIcon = button.iconType ? <i className={button.iconType + " icon"}></i> : null;
            return (
                <div className={buttonClass} onClick={button.onClick}>
                    {buttonIcon}
                    {button.title}
                </div>
            );
        });

        return (
            <div className="ui small modal">
                <div className="ui header">
                    {this.props.title}
                </div>
                <div className="content">
                    {image}
                    <div className="message">
                        <div className="ui small header">
                            {this.props.message}
                        </div>
                    </div>
                    {this.props.customViewComponent}
                </div>
                <div className="actions">
                    {actionButtons}
                </div>
            </div>
        );
    }
});

module.exports = AlertViewController;
