import classnames from 'classnames';
import UserGroup from './UserGroup/SegmentUserGroup.jsx'

export default class AppMainView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      activeTab: 'Users & Groups'
    };
  }

  render() {
    let contentView;

    if (this.state.activeTab === 'General')
      ;
    else if (this.state.activeTab === 'Users & Groups')
      contentView = <UserGroup />;
    else if (this.state.activeTab === 'Security & Policy')
      ;
    else if (this.state.activeTab === 'Assets')
      ;

    return (
      <div className="ui bottom attached segment grid">
        <div className="three wide column">
          <div className="ui visible left vertical menu">
            <a
              className={
                classnames("item", {
                  active: this.state.activeTab === 'General',
                  disabled: true
                })
              }
              onClick={(e) => { this.setState({ activeTab: 'General' }) }}
            >
              <i className="configure icon"></i>
              General
            </a>
            <a
              className={
                classnames("item", {
                  active: this.state.activeTab === 'Users & Groups'
                })
              }
              onClick={(e) => { this.setState({ activeTab: 'Users & Groups' }) }}
            >
              <i className="users icon"></i>
              Users & Groups
            </a>
            <a
              className={
                classnames("item", {
                  active: this.state.activeTab === 'Security & Policy',
                  disabled: true
                })
              }
              onClick={(e) => { this.setState({ activeTab: 'Security & Policy' }) }}
            >
              <i className="lock icon"></i>
              Security & Policy
            </a>
            <a
              className={
                classnames("item", {
                  active: this.state.activeTab === 'Assets'
                })
              }
              onClick={(e) => { this.setState({ activeTab: 'Assets' }) }}
            >
              <i className="laptop icon"></i>
              Assets
            </a>
          </div>
        </div>
        <div className="thirteen wide stretched column">
          {contentView}
        </div>
      </div>
    );
  }
}
