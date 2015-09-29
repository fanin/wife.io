import classnames from 'classnames';
import Input from 'lib/cutie/Input';
import Dropdown from 'lib/cutie/Dropdown';
import UserAPI from 'lib/api/UserAPI';
import GroupCreateDialog from './GroupCreateDialog.jsx';
import GroupModifyDialog from './GroupModifyDialog.jsx';

export default class UserGroupSegment extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      users: [],
      groups: [],
      groupToModify: '',
      groupToRemove: ''
    };
  }

  componentDidMount() {
    Promise.all([ UserAPI.admGetList(), UserAPI.getGroups() ])
      .then((values) => {
        this.setState({ users: values[0].users, groups: values[1].groups })
      })
    ;

    $('.secondary.menu .item')
      .tab('change tab', 'users');
    ;
  }

  showGroupCreateDialog() {
    this.unmountGroupCreateDialog();
    React.render(
      <GroupCreateDialog
        onSuccess={this.groupCreateSuccess.bind(this)}
      />,
      document.getElementById('group-create-dialog')
    );
  }

  unmountGroupCreateDialog() {
    React.unmountComponentAtNode(document.getElementById('group-create-dialog'));
  }

  showGroupModifyDialog(name) {
    this.unmountGroupModifyDialog();
    React.render(
      <GroupModifyDialog
        defaultName={name}
        onSuccess={this.groupModifySuccess.bind(this)}
      />,
      document.getElementById('group-modify-dialog')
    );
  }

  unmountGroupModifyDialog() {
    React.unmountComponentAtNode(document.getElementById('group-modify-dialog'));
  }

  groupCreateSuccess() {
    this.unmountGroupCreateDialog();
    UserAPI.getGroups()
      .then((result) => {
        this.setState({ groups: result.groups });
      })
    ;
  }

  groupModifySuccess() {
    this.unmountGroupModifyDialog();
    UserAPI.getGroups()
      .then((result) => {
        this.setState({ groups: result.groups });
      })
    ;
  }

  render() {
    let userTable = this.state.users.map((user) => {
      return (
        <tr key={user.email}>
          <td className="collapsing">
            <div className="ui fitted slider checkbox">
              <input type="checkbox" defaultChecked={ user.active } />
              <label></label>
            </div>
          </td>
          <td>{ user.firstname + ' ' + user.lastname }</td>
          <td>{ user.email }</td>
          <td style={{ textAlign: 'center' }}>{ user.group }</td>
          <td style={{ textAlign: 'center' }}>
            <i
              className="write link large icon"
              onClick={() => {

              }}
            />
            <i
              className="trash link large red icon"
              onClick={() => {

              }}
            />
          </td>
        </tr>
      );
    });

    let groupTable = this.state.groups.map((group) => {
      return (
        <tr key={group}>
          <td style={{ textAlign: 'center' }}>{ group }</td>
          <td style={{ textAlign: 'center' }}>
            <i
              className={
                classnames(
                  "write large red link icon",
                  {
                    hidden: (group === 'User' || group === 'Admin')
                  }
                )
              }
              onClick={() => {
                this.showGroupModifyDialog(group);
              }}
            />
            <i
              className={
                classnames(
                  "trash large red link icon",
                  {
                    hidden: (group === 'User' || group === 'Admin')
                  }
                )
              }
              onClick={() => {
                UserAPI.removeGroup(group)
                  .then(UserAPI.getGroups)
                  .then((result) => {
                    this.setState({ groups: result.groups, groupToRemove: group });
                  })
                ;
              }}
            />
          </td>
        </tr>
      );
    });

    return (
      <div className="ui basic segment">
        <div className="ui pointing secondary menu">
          <a className="item" data-tab="users">Users</a>
          <a className="item" data-tab="groups">Groups</a>
        </div>
        <div className="ui tab vertical padded segment" data-tab="users">
          <div className="ui borderless menu">
            <div className="ui item">
              <div className="ui green button">Add User</div>
            </div>
            <a className="item active">1</a>
            <a className="item">2</a>
            <a className="item">3</a>
            <a className="item">4</a>
            <div className="right menu">
              <div className="item">
                <div className="ui icon input">
                  <input type="text" placeholder="Search User..." />
                  <i className="search link icon"></i>
                </div>
              </div>
            </div>
          </div>
          <table className="ui compact celled table">
            <thead>
              <tr>
                <th style={{ textAlign: 'center' }}>Active</th>
                <th>Name</th>
                <th>E-mail address</th>
                <th style={{ textAlign: 'center' }}>Group</th>
                <th style={{ textAlign: 'center' }}>Edit</th>
              </tr>
            </thead>
            <tbody>
              {userTable}
            </tbody>
          </table>
        </div>
        <div className="ui tab vertical padded segment" data-tab="groups">
          <div className="ui borderless menu">
            <div className="ui item">
              <div
                className="ui green button"
                onClick={() => { this.showGroupCreateDialog() }}
              >
                New Group
              </div>
            </div>
            <a className="item active">1</a>
            <a className="item">2</a>
            <a className="item">3</a>
            <a className="item">4</a>
            <div className="right menu">
              <div className="item">
                <div className="ui icon input">
                  <input type="text" placeholder="Search Group..." />
                  <i className="search link icon"></i>
                </div>
              </div>
            </div>
          </div>
          <table className="ui compact celled collapsing table">
            <col width="70%" />
            <col width="30%" />
            <thead>
              <tr>
                <th style={{ textAlign: 'center' }}>Name</th>
                <th style={{ textAlign: 'center' }}>Edit</th>
              </tr>
            </thead>
            <tbody>
              {groupTable}
            </tbody>
          </table>
        </div>
        <div id='group-create-dialog' />
        <div id='group-modify-dialog' />
      </div>
    );
  }
}
