'use strict';

export default class Input extends React.Component {

  static defaultProps = {
    type: 'text',
    name: 'default',
    defaultValue: ''
  };

  constructor(props) {
    super(props);
    this.state = {
      value: ''
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.props.defaultValue !== nextProps.defaultValue) {
      this.setState({ value: '' });
      return false;
    }
    else
      return true;
  }

  render() {
    return (
      <div className="ui input">
        <input
          type={this.props.type}
          name={this.props.name}
          value={this.state.value || this.props.defaultValue}
          onChange={ (e) => {
            let stateObj = {};
            stateObj['value'] = e.target.value;
            this.setState(stateObj);
          }}
        />
      </div>
    );
  }
}
