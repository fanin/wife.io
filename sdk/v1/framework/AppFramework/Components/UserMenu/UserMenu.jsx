import Dropdown from 'lib/cutie/Dropdown';
import UserDialog from './UserDialog.jsx';
import UserAPI from 'lib/api/UserAPI';

export default class UserMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: ''
    };
  }

  componentDidMount() {
    if ($.cookie("userid")) {
      this.getUsername();
    }
  }

  getUsername() {
    UserAPI.getProfile()
      .then((result) => {
        this.setState({
          username: result.user.firstname
        });
      })
      .catch((error) => {

      });
  }

  handleLogin(e) {
    if (!this.state.username) {
      React.unmountComponentAtNode(document.getElementById('user-dialog'));
      React.render(
        <UserDialog
          formType="login"
          onSuccess={() => {
            this.getUsername();
          }}
        />,
        document.getElementById('user-dialog')
      );
    }
  }

  render() {
    let userDropdownMenu = null;

    if (this.state.username) {
      userDropdownMenu = [
        (
          <div
            className="item"
            key="password"
            data-value="password"
          >
            <i className="lock icon" />
            Change password
          </div>
        ),
        (
          <div
            className="item"
            key="profile"
            data-value="profile"
          >
            <i className="edit icon" />
            Edit profile
          </div>
        ),
        (
          <div
            className="item"
            key="logout"
            data-value="logout"
          >
            <i className="sign out icon" />
            Log out
          </div>
        )
      ];
    }

    return (
      <Dropdown
        classes="item"
        buttonText={this.state.username || 'Log in'}
        buttonImageClass="avatar"
        buttonImageSource="/img/guest-avatar.jpg"
        itemSelectBar={false}
        onClick={this.handleLogin.bind(this)}
        onTouchStart={this.handleLogin.bind(this)}
        onChange={(value, text) => {
          switch (value) {
          case 'password':
            React.unmountComponentAtNode(document.getElementById('user-dialog'));
            React.render(
              <UserDialog formType="password" />,
              document.getElementById('user-dialog')
            );
            break;
          case 'profile':
            React.unmountComponentAtNode(document.getElementById('user-dialog'));
            React.render(
              <UserDialog
                formType="profile"
                onSuccess={() => {
                  this.getUsername();
                }}
              />,
              document.getElementById('user-dialog')
            );
            break;
          case 'logout':
            UserAPI.logout().then((result) => {
              this.setState({ username: '' });
            });
            break;
          }
        }}
      >
        {userDropdownMenu}
      </Dropdown>
    );
  }
}
