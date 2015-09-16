export default class CongratsView extends React.Component {

  static defaultProps = {
    message: ''
  };

  render() {
    return (
      <div>
        <i className="huge checkmark box green icon"></i>
        <span className="text" style={{ fontSize: '1.5em' }}>{this.props.message}</span>
      </div>
    );
  }
}
