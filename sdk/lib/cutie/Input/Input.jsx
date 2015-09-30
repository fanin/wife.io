'use strict';

import classnames from 'classnames';

export default class Input extends React.Component {

  static defaultProps = {
    type: 'text',
    classes: '',
    name: 'default',
    placeholder: '',
    defaultValue: '',
    readonly: false,
    onChange: (text) => {}
  };

  constructor(props) {
    super(props);
    this.state = {
      value: '_init_'
    };
  }

  onChange(e) {
    let stateObj = {};
    stateObj['value'] = e.target.value;
    this.setState(stateObj);
    this.props.onChange(e.target.value);
  }

  render() {

    var props = {
      type: this.props.type,
      name: this.props.name,
      placeholder: this.props.placeholder,
      value: this.state.value === '_init_' ? this.props.defaultValue : this.state.value,
      onChange: this.onChange.bind(this),
      readOnly: this.props.readonly
    };

    return (
      <div className={classnames("ui", this.props.classes, "input")}>
        <input {...props} />
      </div>
    );
  }
}
