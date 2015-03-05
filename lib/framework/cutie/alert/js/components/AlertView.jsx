'use strict';

var AlertView = React.createClass({
    getDefaultProps: function() {
        return {
            title: "",
            image: "",
            description: "",
            affirmativeButtonText: "Yes",
            affirmativeButtonColor: "green",
            negativeButtonText: "No",
            negativeButtonColor: "red",
            onActionNegative: function() {},
            onActionAffirmative: function() {}
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

    componentWillUnmount: function () {
        if (this.modalInstance) {
            this.modalInstance.modal('destroy');
        }
    },

    render: function() {
        var image;
        var negativeButtonClass = "ui right labeled icon " + this.props.negativeButtonColor + " button deny";
        var affirmativeButtonClass = "ui right labeled icon " + this.props.affirmativeButtonColor + " button approve";

        if (this.props.image)
            image = <div className="image">{this.props.image}</div>;

        return (
            <div className="ui small alert modal">
                <div className="header">
                    {this.props.title}
                </div>
                <div className="content">
                    {image}
                    <div className="description">
                        {this.props.description}
                    </div>
                </div>
                <div className="actions">
                    <div className={negativeButtonClass} onClick={this.props.onActionNegative}>
                        <i className="remove icon"></i>
                        {this.props.negativeButtonText}
                    </div>
                    <div className={affirmativeButtonClass} onClick={this.props.onActionAffirmative}>
                        <i className="checkmark icon"></i>
                        {this.props.affirmativeButtonText}
                    </div>
                </div>
            </div>
        );
    }
});

module.exports = AlertView;
