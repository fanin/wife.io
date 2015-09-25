import UserGroupSegment from './UserGroupSegment.jsx'

export default class AppMainView extends React.Component {

  constructor(props) {
    super(props);
  }

  componentDidMount() {

  }

  render() {
    return (
      <div className="ui bottom attached segment grid">
        <div className="three wide column">
          <div className="ui visible left vertical menu">
            <a className="item disabled">
              <i className="configure icon"></i>
              General
            </a>
            <a className="item active">
              <i className="users icon"></i>
              Users & Groups
            </a>
            <a className="item disabled">
              <i className="lock icon"></i>
              Security & Policy
            </a>
          </div>
        </div>
        <div className="thirteen wide stretched column">
          <UserGroupSegment />
        </div>
      </div>
    );
  }
}
