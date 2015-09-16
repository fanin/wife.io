'use strict';

export default class Input extends React.Component {

  static defaultProps = {
    type: 'text',
    classes: '',
    name: 'default',
    defaultValue: '',
    readonly: false
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
  }

  render() {
    var cx = React.addons.classSet;

    var props = {
      type: this.props.type,
      name: this.props.name,
      value: this.state.value === '_init_' ? this.props.defaultValue : this.state.value,
      onChange: this.onChange.bind(this),
      disabled: this.props.readonly
    };

    return (
      <div className={cx("ui", this.props.classes, "input")}>
        <input {...props} />
      </div>
    );
  }
}
