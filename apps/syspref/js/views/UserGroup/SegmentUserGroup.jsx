'use strict';

import classnames from 'classnames';
import Input from 'lib/cutie/Input';
import Checkbox from 'lib/cutie/Checkbox';
import Dropdown from 'lib/cutie/Dropdown';
import UserAPI from 'lib/api/UserAPI';
import DialogUserCreate from './DialogUserCreate.jsx';
import DialogUserModify from './DialogUserModify.jsx';
import DialogGroupCreate from './DialogGroupCreate.jsx';
import DialogGroupModify from './DialogGroupModify.jsx';

export default class SegmentUserGroup extends React.Component {

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

  showUserCreateDialog() {
    this.refs.userCreateDialog.show();
  }

  showUserModifyDialog(email) {
    this.refs.userModifyDialog.show(email);
  }

  showGroupCreateDialog() {
    this.refs.groupCreateDialog.show();
  }

  showGroupModifyDialog() {
    this.refs.groupModifyDialog.show();
  }

  toggleUserActivation(target) {
    UserAPI.admSetProfile('email=' + encodeURIComponent(target.getName()) +
                          '&active=' + (+!!target.isChecked()));
  }

  userCreateSuccess() {
    this.refs.userCreateDialog.hide();
    UserAPI.admGetList()
      .then((result) => {
        this.setState({ users: result.users });
      })
      .catch((error) => {
        console.log(error);
      })
    ;
  }

  userModifySuccess() {
    this.refs.userModifyDialog.hide();
    UserAPI.admGetList()
      .then((result) => {
        this.setState({ users: result.users });
      })
      .catch((error) => {
        console.log(error);
      })
    ;
  }

  groupCreateSuccess() {
    this.refs.groupCreateDialog.hide();
    UserAPI.getGroups()
      .then((result) => {
        this.setState({ groups: result.groups });
      })
    ;
  }

  groupModifySuccess() {
    this.refs.groupModifyDialog.hide();
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
            <Checkbox
              name={user.email}
              readOnly={(user.email.split('@')[0] === 'admin')}
              checked={user.active}
              onChange={this.toggleUserActivation}
            />
          </td>
          <td>{user.firstname + ' ' + user.lastname}</td>
          <td>{user.email}</td>
          <td style={{ textAlign: 'center' }}>{user.group}</td>
          <td style={{ textAlign: 'center' }}>
            <i
              className="write link large icon"
              onClick={() => { this.showUserModifyDialog(user.email) }}
            />
            <i
              className={
                classnames(
                  "trash link large red icon",
                  {
                    hidden: (user.email.split('@')[0] === 'admin')
                  }
                )
              }
              onClick={() => {
                UserAPI.admDeactivate(user.email, { delete: true })
                  .then(UserAPI.admGetList)
                  .then((result) => {
                    this.setState({ users: result.users });
                  })
                  .catch((error) => {
                    console.log(error);
                  })
                ;
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
                this.setState({ groupToModify: group });
                this.showGroupModifyDialog();
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
              <div
                className="ui green button"
                onClick={this.showUserCreateDialog.bind(this)}
              >
                Add User
              </div>
            </div>
            <a className="item active">1</a>
            <a className="item">2</a>
            <a className="item">3</a>
            <a className="item">4</a>
            <div className="right menu">
              <div className="item">
                <div className="ui icon input">
                  <Input
                    type="text"
                    placeholder="Search User..."
                    onChange={(text) => {
                      if (!text) {
                        UserAPI.admGetList()
                          .then((result) => {
                            this.setState({ users: result.users });
                          })
                        ;
                      }
                      else {
                        UserAPI.getProfile({ searches: text })
                          .then((result) => {
                            this.setState({ users: result.users });
                          })
                        ;
                      }
                    }}
                  />
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
                  <Input
                    type="text"
                    placeholder="Search Group..."
                    onChange={(text) => {
                      UserAPI.getGroups({ searches: text })
                        .then((result) => {
                          this.setState({ groups: result.groups });
                        })
                      ;
                    }}
                  />
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
        <div>
          <DialogUserCreate
            ref="userCreateDialog"
            onSuccess={this.userCreateSuccess.bind(this)}
          />
          <DialogUserModify
            ref="userModifyDialog"
            onSuccess={this.userModifySuccess.bind(this)}
          />
          <DialogGroupCreate
            ref="groupCreateDialog"
            onSuccess={this.groupCreateSuccess.bind(this)}
          />
          <DialogGroupModify
            ref="groupModifyDialog"
            defaultName={this.state.groupToModify}
            onSuccess={this.groupModifySuccess.bind(this)}
          />
        </div>
      </div>
    );
  }
}
