import SegmentUserGroup from './SegmentUserGroup.jsx'

export default class AppMainView extends React.Component {

  constructor(props) {
    super(props);
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
            <a className="item">
              <i className="laptop icon"></i>
              Assets
            </a>
          </div>
        </div>
        <div className="thirteen wide stretched column">
          <SegmentUserGroup />
        </div>
      </div>
    );
  }
}
