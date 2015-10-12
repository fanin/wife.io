/**
 * Note: dropdown default values are set at first mount, and not avaliable to modify them later.
 */

'use strict';

import classnames from 'classnames';

export default class Dropdown extends React.Component {

  static defaultProps = {
    disabled: false,
    name: '',
    type: '',
    classes: '',
    buttonText: '',
    buttonIconClass: '',
    buttonImageClass: '',
    buttonImageSource: '',
    selectDefaultValue: '',
    selectHintText: '',
    action: 'activate',
    transition: 'auto',
    onClick: (e) => {},
    onTouchStart: (e) => {},
    onChange: (value, text) => {}
  };

  constructor(props) {
    super(props);
    this.state = {
      disabled: false
    };
  }

  componentDidMount() {
    var _settings = (this.props.action !== 'hide')
      ? {
          transition: this.props.transition,
          action: this.props.action,
          onChange: (value, text) => {
            this.props.onChange(value, text);
          }
        }
      : {
          transition: this.props.transition,
          action: (text, value) => {
            $(React.findDOMNode(this)).dropdown('hide');
            this.props.onChange(value, text);
          }
        };

    $(React.findDOMNode(this)).dropdown(_settings);
  }

  componentWillUpdate(nextProps, nextState) {
    if (nextProps.disabled)
      $(React.findDOMNode(this)).addClass("disabled");
    else
      $(React.findDOMNode(this)).removeClass("disabled");
  }

  componentDidUpdate(prevProps, prevState) {
    var _settings = (this.props.action !== 'hide')
      ? {
          transition: this.props.transition,
          action: this.props.action,
          onChange: (value, text) => {
            this.props.onChange(value, text);
          }
        }
      : {
          transition: this.props.transition,
          action: (text, value) => {
            $(React.findDOMNode(this)).dropdown('hide');
            this.props.onChange(value, text);
          }
        };

    $(React.findDOMNode(this)).dropdown(_settings);

    if (this.props.selectDefaultValue !== prevProps.selectDefaultValue) {
      if (this.props.type.indexOf('multiple') >= 0) {
        $(React.findDOMNode(this)).dropdown(
          'set exactly',
          this.props.selectDefaultValue.split(',')
        );
      }
      else if (this.props.type.indexOf('selection') >= 0) {
        $(React.findDOMNode(this)).dropdown(
          'set selected',
          this.props.selectDefaultValue
        );
      }
    }
  }

  render() {
    var dropdown;
    var classes;

    if (this.props.type.indexOf('selection') >= 0) {
      classes = classnames('ui fluid dropdown', this.props.classes, this.props.type);

      dropdown = (
        <div className={classes}>
          <input
            name={this.props.name}
            type="hidden"
          />
          <i className="dropdown icon"></i>
          <div className="default text">{this.props.selectHintText}</div>
          <div className="menu">
            {this.props.children}
          </div>
        </div>
      );
    }
    else {
      classes = classnames('ui dropdown', this.props.classes, this.props.type);

      var buttonIcon = this.props.buttonIconClass
            ? <i className={this.props.buttonIconClass + ' icon'} /> : null;

      var buttonImage = this.props.buttonImageClass
            ? <img
                className={'ui ' + this.props.buttonImageClass + ' image'}
                src={this.props.buttonImageSource}
              /> : buttonIcon;

      var buttonTextSpan = this.props.buttonText
            ? <span className="text">{this.props.buttonText}</span> : null;

      dropdown = (
        <div
          className={classes}
          onClick={this.props.onClick}
          onTouchStart={this.props.onTouchStart}
        >
          {buttonImage}
          {buttonTextSpan}
          <div className="menu">
            {this.props.children}
          </div>
        </div>
      );
    }

    return dropdown;
  }
}
