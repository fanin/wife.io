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

const LIMIT_PER_PAGE = 1;

export default class SegmentUserGroup extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      users: [],
      groups: [],
      userPages: 0,
      groupPages: 0,
      userCurrPage: 1,
      groupCurrPage: 1,
      userSearchText: '',
      groupSearchText: ''
    };
  }

  componentDidMount() {
    Promise.all([
      UserAPI.admGetList({ page: this.state.userCurrPage, limit: LIMIT_PER_PAGE }),
      UserAPI.getGroups({ page: this.state.groupCurrPage, limit: LIMIT_PER_PAGE })
    ]).then((values) => {
      this.setState({ users: values[0].users, groups: values[1].groups })
    }).catch((error) => {
      if (error.code !== 403)
        console.log(error);
    });

    $('.secondary.menu .item')
      .tab('change tab', 'users')
    ;
  }

  componentDidUpdate(prevProps, prevState) {
    UserAPI.userCount({ searches: this.state.userSearchText })
      .then((result) => {
        let pages = (result.count / LIMIT_PER_PAGE) +
                      !!(result.count % LIMIT_PER_PAGE) || 1;

        if (
          pages !== this.state.userPages ||
          this.state.userCurrPage !== prevState.userCurrPage
        ) {
          UserAPI.admGetList({
            searches: this.state.userSearchText,
            page: this.state.userCurrPage,
            limit: LIMIT_PER_PAGE
          }).then((result) => {
            this.setState({
              users: result.users,
              userPages: pages,
              userCurrPage: (this.state.userCurrPage > pages)
                              ? pages : this.state.userCurrPage
            });
          });
        }
      })
      .catch((error) => {
        console.log(error);
      })
    ;

    UserAPI.groupCount({ searches: this.state.groupSearchText })
      .then((result) => {
        let pages = (result.count / LIMIT_PER_PAGE) +
                      !!(result.count % LIMIT_PER_PAGE) || 1;

        if (
          pages !== this.state.groupPages ||
          this.state.groupCurrPage !== prevState.groupCurrPage
        ) {
          UserAPI.getGroups({
            searches: this.state.groupSearchText,
            page: this.state.groupCurrPage,
            limit: LIMIT_PER_PAGE
          }).then((result) => {
            this.setState({
              groups: result.groups,
              groupPages: pages,
              groupCurrPage: (this.state.groupCurrPage > pages)
                                ? pages : this.state.groupCurrPage
            });
          });
        }
      })
      .catch((error) => {
        console.log(error);
      })
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

  showGroupModifyDialog(group) {
    this.refs.groupModifyDialog.show(group);
  }

  toggleUserActivation(target) {
    UserAPI.admSetProfile('email=' + encodeURIComponent(target.getName()) +
                          '&active=' + (+!!target.isChecked()));
  }

  userCreateSuccess() {
    this.refs.userCreateDialog.hide();
    UserAPI.admGetList({
      searches: this.state.userSearchText,
      page: this.state.userCurrPage,
      limit: LIMIT_PER_PAGE
    })
    .then((result) => {
      this.setState({ users: result.users });
    })
    .catch((error) => {
      console.log(error);
    });
  }

  userModifySuccess() {
    this.refs.userModifyDialog.hide();
    UserAPI.admGetList({
      searches: this.state.userSearchText,
      page: this.state.userCurrPage,
      limit: LIMIT_PER_PAGE
    })
    .then((result) => {
      this.setState({ users: result.users });
    })
    .catch((error) => {
      console.log(error);
    });
  }

  groupCreateSuccess() {
    this.refs.groupCreateDialog.hide();
    UserAPI.getGroups({
      searches: this.state.groupSearchText,
      page: this.state.groupCurrPage,
      limit: LIMIT_PER_PAGE
    }).then((result) => {
      this.setState({ groups: result.groups });
    });
  }

  groupModifySuccess() {
    this.refs.groupModifyDialog.hide();
    UserAPI.getGroups({
      searches: this.state.groupSearchText,
      page: this.state.groupCurrPage,
      limit: LIMIT_PER_PAGE
    }).then((result) => {
      this.setState({ groups: result.groups });
    });
  }

  render() {
    let userPagination = [];
    let userPaginationEllipses = [];
    let groupPagination = [];
    let groupPaginationEllipses = [];
    let i = 1, j = 5;

    for (; i <= this.state.userPages; i++) {
      if (this.state.userPages >= 10) {
        if (i === 5) {
          for (; j <= this.state.userPages - 4; j++) {
            userPaginationEllipses.push(
              <a className="item" key={'user-page' + j} data-value={j}>{j}</a>
            );
          }

          userPagination.push(
            <Dropdown
              key='user-page-ellipses'
              classes='item'
              buttonText='...'
              action='select'
              onChange={(value, text) => {
                this.setState({ userCurrPage: value })
              }}
            >
              {userPaginationEllipses}
            </Dropdown>
          );

          i = j - 1;

          continue;
        }
      }

      userPagination.push(
        <a
          key={'user-page' + i}
          className={classnames('item', { active: (this.state.userCurrPage === i) })}
          onClick={(e) => {
            this.setState({ userCurrPage: parseInt($(e.target).text()) });
          }}
        >
          {i}
        </a>
      );
    }

    for (i = 1; i <= this.state.groupPages; i++) {
      if (this.state.groupPages >= 10) {
        if (i === 5) {
          for (j = 5; j <= this.state.groupPages - 4; j++) {
            groupPaginationEllipses.push(
              <a className="item" key={'group-page' + j} data-value={j}>{j}</a>
            );
          }

          groupPagination.push(
            <Dropdown
              key='group-page-ellipses'
              classes='item'
              buttonText='...'
              action='select'
              onChange={(value, text) => {
                this.setState({ groupCurrPage: value })
              }}
            >
              {groupPaginationEllipses}
            </Dropdown>
          );

          i = j - 1;

          continue;
        }
      }

      groupPagination.push(
        <a
          key={'group-page' + i}
          className={classnames('item', { active: (this.state.groupCurrPage === i) })}
          onClick={(e) => {
            this.setState({ groupCurrPage: parseInt($(e.target).text()) });
          }}
        >
          {i}
        </a>
      );
    }

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
                  .then((result) => {
                    return UserAPI.admGetList({
                      searches: this.state.userSearchText,
                      page: this.state.userCurrPage,
                      limit: LIMIT_PER_PAGE
                    });
                  })
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
                this.showGroupModifyDialog(group);
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
                    return UserAPI.getGroups({
                      searches: this.state.groupSearchText,
                      page: this.state.groupCurrPage,
                      limit: LIMIT_PER_PAGE
                    });
                  })
                  .then((result) => {
                    this.setState({ groups: result.groups });
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
            {userPagination}
            <div className="right menu">
              <div className="item">
                <div className="ui icon input">
                  <Input
                    type="text"
                    placeholder="Search User..."
                    onChange={(text) => {
                      if (!text) {
                        this.setState({ userCurrPage: 1, userSearchText: '' });
                      }
                      else {
                        UserAPI.admGetList({
                          searches: text,
                          page: 1,
                          limit: LIMIT_PER_PAGE
                        })
                        .then((result) => {
                          this.setState({
                            users: result.users,
                            userSearchText: text,
                            userCurrPage: 1
                          });
                        });
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
            {groupPagination}
            <div className="right menu">
              <div className="item">
                <div className="ui icon input">
                  <Input
                    type="text"
                    placeholder="Search Group..."
                    onChange={(text) => {
                      if (!text) {
                        this.setState({ groupCurrPage: 1, groupSearchText: '' });
                      }
                      else {
                        UserAPI.getGroups({
                          searches: text,
                          page: this.state.groupCurrPage,
                          limit: LIMIT_PER_PAGE
                        }).then((result) => {
                          this.setState({
                            groups: result.groups,
                            groupSearchText: text,
                            groupCurrPage: 1
                          });
                        });
                      }
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
                <th style={{ textAlign: 'center' }}>Description</th>
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
            onSuccess={this.groupModifySuccess.bind(this)}
          />
        </div>
      </div>
    );
  }
}
