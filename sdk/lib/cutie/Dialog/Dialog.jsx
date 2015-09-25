'use strict';

import classnames from 'classnames';
import { randomString } from 'lib/utils/common/string-misc'

class Dialog extends React.Component {

  static defaultProps = {
    size: "small",
    closable: false,
    onShow: () => {},
    onVisible: () => {},
    onHide: () => {},
    onHidden: () => {},
    onApprove: () => {},
    onDeny: () => {}
  };

  componentDidMount() {
    $(React.findDOMNode(this)).modal({
      closable: this.props.closable,
      detachable: false,
      onShow: this.props.onShow,
      onVisible: this.props.onVisible,
      onHide:this.props.onHide,
      onHidden: this.props.onHidden,
      onApprove: this.props.onApprove,
      onDeny: this.props.onDeny
    });

    $(React.findDOMNode(this)).click((e) => {
      e.stopPropagation();
      e.stopImmediatePropagation();
    });
  }

  componentDidUpdate(prevProps, prevState) {
    $(React.findDOMNode(this)).modal('refresh');
  }

  componentWillUnmount() {
    $(React.findDOMNode(this)).modal('hide');
  }

  show() {
    $(React.findDOMNode(this)).modal('show');
  }

  render() {
    return (
      <div className={"ui long " + this.props.size + " modal"}>
        { this.props.children }
      </div>
    );
  }
}

export class Header extends React.Component {

  static defaultProps = {
    icon: ''
  };

  render() {
    let headerIcon = this.props.icon
      ? <i className={this.props.icon + " icon"} />
      : null;

    return (
      <div className="ui header">
        {headerIcon}
        <div className="content">
          {this.props.children}
        </div>
      </div>
    );
  }
}

export class Content extends React.Component {

  static defaultProps = {
    imageElement: null
  };

  render() {
    let contentClass = classnames({ image: this.props.imageElement }, 'content');
    let imageClass = classnames({ image: this.props.imageElement });

    return (
      <div className={contentClass}>
        <div className={imageClass}>
          {this.props.imageElement}
        </div>
        <div className="description">
          {this.props.children}
        </div>
      </div>
    );
  }
}


export class ButtonSet extends React.Component {
  render() {
    return (
      <div className="actions">
        {this.props.children}
      </div>
    );
  }
}


export class Container extends React.Component {

  static defaultProps = {
    size: "small",
    closable: false,
    onShow: () => {},
    onVisible: () => {},
    onHide: () => {},
    onHidden: () => {},
    onApprove: () => {},
    onDeny: () => {}
  };

  constructor(props) {
    super(props);
    this.componentId = 'dialog-' + randomString('XXXXXXXXXXXX');
  }

  componentDidUpdate(prevProps, prevState) {
    this.renderDialog();
  }

  renderDialog() {
    this.dialog = React.render(
      <Dialog
        {...this.props}
        onHidden={() => { this.hide(); this.props.onHidden() }}
      >
        { this.props.children }
      </Dialog>,
      document.getElementById(this.componentId)
    );
  }

  show() {
    this.renderDialog();
    this.dialog.show();
  }

  hide() {
    React.unmountComponentAtNode(document.getElementById(this.componentId));
  }

  render() {
    return (
      <div id={this.componentId}></div>
    );
  }
}

