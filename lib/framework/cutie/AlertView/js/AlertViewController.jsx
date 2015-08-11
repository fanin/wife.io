'use strict';

var AlertViewController = React.createClass({
    getDefaultProps: function() {
        return {
            size: "small",
            title: "",
            image: "",
            message: "",
            customViewComponent: null,
            actionButtons: [],
            actionButtonsAlign: "right",
            closable: false,
            onShow: function() {},
            onHidden: function() {},
            onApprove: function() {},
            onDeny: function() {}
        };
    },

    show: function() {
        if (!this.modalInstance)
            this.modalInstance = $(this.getDOMNode()).modal({
                closable: this.props.closable,
                detachable: false,
                onShow: this.props.onShow,
                onHidden: this.props.onHidden,
                onApprove: this.props.onApprove,
                onDeny: this.props.onDeny
            });
        this.modalInstance.modal('show');
    },

    hide: function() {
        this.modalInstance.modal('hide');
    },

    componentDidMount: function() {
        $(this.getDOMNode()).find(".actions").css("text-align", this.props.actionButtonsAlign);
    },

    componentDidUpdate: function(prevProps, prevState) {
        if (this.modalInstance && this.modalInstance.modal('is active')) {
            this.modalInstance.modal('refresh');
        }
    },

    componentWillUnmount: function() {
        this.modalInstance && this.modalInstance.modal('destroy');
    },

    render: function() {
        var image = this.props.image ? <div className="image">{this.props.image}</div> : null;

        var actionButtons = this.props.actionButtons.map(function(button) {
            var buttonClass = "ui " + (button.iconType ? "center labeled " : "center ")
                                    + "icon " + button.color + " button " + button.actionType;
            var buttonIcon = button.iconType ? <i className={button.iconType + " icon"} /> : null;
            return (
                <div className={buttonClass} key={button.title} onClick={function(e) { e.stopPropagation() }}>
                    {buttonIcon}
                    {button.title}
                </div>
            );
        });

        return (
            <div className={"ui long " + this.props.size + " modal"}>
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
