'use strict';

import classnames from 'classnames';
import Input from 'lib/cutie/Input';
import Checkbox from 'lib/cutie/Checkbox';
import Dropdown from 'lib/cutie/Dropdown';
import Pagination from 'lib/cutie/Pagination';
import UserAPI from 'lib/api/UserAPI';
import DialogUserCreate from './DialogUserCreate.jsx';
import DialogUserUpdate from './DialogUserUpdate.jsx';
import DialogGroupCreate from './DialogGroupCreate.jsx';
import DialogGroupUpdate from './DialogGroupUpdate.jsx';

const LIMIT_PER_PAGE = 70;

export default class SegmentUserGroup extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      users: [],
      groups: [],
      userPages: 1,
      groupPages: 1,
      userSearchText: '',
      groupSearchText: ''
    };
  }

  componentDidMount() {
    Promise.all([
      UserAPI.admGetList({ page: this.refs.userPaginator.position(), limit: LIMIT_PER_PAGE }),
      UserAPI.getGroups({ page: this.refs.groupPaginator.position(), limit: LIMIT_PER_PAGE })
    ]).then((values) => {
      this.setState({
        users: values[0].users,
        userPages: this.calcPages(values[0].count),
        groups: values[1].groups,
        groupPages: this.calcPages(values[1].count),
      })
    }).catch((error) => {
      if (error.code !== 403)
        console.log(error);
    });

    $('.secondary.menu .item')
      .tab('change tab', 'users')
    ;
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.userSearchText !== this.state.userSearchText)
      this.reloadUsers();
    if (prevState.groupSearchText !== this.state.groupSearchText)
      this.reloadGroups();
  }

  reloadUsers() {
    return UserAPI.admGetList({
      searches: this.state.userSearchText,
      page: this.refs.userPaginator.position(),
      limit: LIMIT_PER_PAGE
    })
    .then((result) => {
      this.setState({
        users: result.users,
        userPages: this.calcPages(result.count)
      });
    })
    .catch((error) => {
      console.log(error);
    });
  }

  reloadGroups() {
    return UserAPI.getGroups({
      searches: this.state.groupSearchText,
      page: this.refs.groupPaginator.position(),
      limit: LIMIT_PER_PAGE
    }).then((result) => {
      this.setState({
        groups: result.groups,
        groupPages: this.calcPages(result.count)
      });
    });
  }

  calcPages(count) {
    return Math.ceil(count / LIMIT_PER_PAGE) || 1;
  }

  showUserCreateDialog() {
    this.refs.userCreateDialog.show();
  }

  showUserUpdateDialog(email) {
    this.refs.userUpdateDialog.show(email);
  }

  showGroupCreateDialog() {
    this.refs.groupCreateDialog.show();
  }

  showGroupUpdateDialog(group) {
    this.refs.groupUpdateDialog.show(group);
  }

  toggleUserActivation(target) {
    UserAPI.admSetProfile('email=' + encodeURIComponent(target.getName()) +
                          '&active=' + (+!!target.isChecked()));
  }

  userCreateSuccess() {
    this.refs.userCreateDialog.hide();
    this.reloadUsers();
  }

  userUpdateSuccess() {
    this.refs.userUpdateDialog.hide();
    this.reloadUsers();
  }

  groupCreateSuccess() {
    this.refs.groupCreateDialog.hide();
    this.reloadGroups();
  }

  groupUpdateSuccess() {
    this.refs.groupUpdateDialog.hide();
    this.reloadGroups();
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
            {user.register_date ? (new Date(user.register_date)).toLocaleString() : ''}
          </td>
          <td style={{ textAlign: 'center' }}>
            {user.last_login_date ? (new Date(user.last_login_date)).toLocaleString() : ''}
          </td>
          <td style={{ textAlign: 'center' }}>
            <i
              className="write link large icon"
              onClick={() => { this.showUserUpdateDialog(user.email) }}
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
                  .then((result) => {
                    return this.reloadUsers();
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
        <tr key={group.name}>
          <td
            style={{
              textAlign: 'center',
              fontWeight: (group.name === 'User' || group.name === 'Admin') ? 'bold' : 'normal'
            }}
          >
            {group.name}
          </td>
          <td>{group.description}</td>
          <td style={{ textAlign: 'center' }}>
            <i
              className="write large link icon"
              onClick={() => {
                this.showGroupUpdateDialog(group);
              }}
            />
            <i
              className={
                classnames(
                  "trash large red link icon",
                  {
                    hidden: (group.name === 'User' || group.name === 'Admin')
                  }
                )
              }
              onClick={() => {
                UserAPI.removeGroup(group.name)
                  .then((result) => {
                    return this.reloadGroups();
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
                New User
              </div>
            </div>
            <Pagination
              ref="userPaginator"
              classes="transparent"
              pages={this.state.userPages}
              onSelectPage={(page) => { this.reloadUsers() }}
            />
            <div className="right menu">
              <div className="item">
                <div className="ui icon input">
                  <Input
                    type="text"
                    placeholder="Search User..."
                    onChange={(text) => {
                      this.refs.userPaginator.setPosition(1);
                      this.setState({ userSearchText: text || '' });
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
                <th style={{ textAlign: 'center' }}>Register date</th>
                <th style={{ textAlign: 'center' }}>Last login time</th>
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
            <Pagination
              ref="groupPaginator"
              classes="transparent"
              pages={this.state.groupPages}
              onSelectPage={(page) => { this.reloadGroups() }}
            />
            <div className="right menu">
              <div className="item">
                <div className="ui icon input">
                  <Input
                    type="text"
                    placeholder="Search Group..."
                    onChange={(text) => {
                      this.refs.groupPaginator.setPosition(1);
                      this.setState({ groupSearchText: text || '' });
                    }}
                  />
                  <i className="search link icon"></i>
                </div>
              </div>
            </div>
          </div>
          <table className="ui compact celled table">
            <col width="20%" />
            <col width="70%" />
            <col width="10%" />
            <thead>
              <tr>
                <th style={{ textAlign: 'center' }}>Name</th>
                <th>Description</th>
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
          <DialogUserUpdate
            ref="userUpdateDialog"
            onSuccess={this.userUpdateSuccess.bind(this)}
          />
          <DialogGroupCreate
            ref="groupCreateDialog"
            onSuccess={this.groupCreateSuccess.bind(this)}
          />
          <DialogGroupUpdate
            ref="groupUpdateDialog"
            onSuccess={this.groupUpdateSuccess.bind(this)}
          />
        </div>
      </div>
    );
  }
}
