'use strict';

export default class DialogController extends React.Component {

  show() {
    if (!this.modalInstance)
      this.modalInstance = $(React.findDOMNode(this)).modal({
        closable: this.props.closable,
        detachable: false,
        onShow: this.props.onShow,
        onHidden: this.props.onHidden,
        onApprove: this.props.onApprove,
        onDeny: this.props.onDeny
      });
    this.modalInstance.modal('show');
  }

  hide() {
    this.modalInstance.modal('hide');
  }

  componentDidMount() {
    $(React.findDOMNode(this))
      .find(".actions")
      .css("text-align", this.props.actionButtonsAlign);
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.modalInstance && this.modalInstance.modal('is active')) {
      this.modalInstance.modal('refresh');
    }
  }

  componentWillUnmount() {
    this.modalInstance && this.modalInstance.modal('destroy');
  }

  render() {
    var image = this.props.image
                  ? <div className="image">{this.props.image}</div>
                  : null;

    var actionButtons = this.props.actionButtons.map(function(button) {
      var buttonClass = "ui "
                  + (button.iconType ? "center labeled " : "center ")
                  + "icon " + button.color + " button " + button.actionType;
      var buttonIcon = button.iconType
                        ? <i className={button.iconType + " icon"} />
                        : null;
      return (
        <div
          className={buttonClass}
          key={button.title}
          onClick={function(e) { e.stopPropagation() }}>
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
          {this.props.customView}
        </div>
        <div className="actions">
          {actionButtons}
        </div>
      </div>
    );
  }
}

DialogController.defaultProps = {
  size: "small",
  title: "",
  image: "",
  message: "",
  customView: null,
  actionButtons: [],
  actionButtonsAlign: "right",
  closable: false,
  onShow: function() {},
  onHidden: function() {},
  onApprove: function() {},
  onDeny: function() {}
};
