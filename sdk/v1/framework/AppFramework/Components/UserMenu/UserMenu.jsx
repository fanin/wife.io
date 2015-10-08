import Dropdown from 'lib/cutie/Dropdown';
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

  componentDidUpdate(prevProps, prevState) {
    if ($.cookie("userid")) {
      this.getUsername();
    }
  }

  getUsername() {
    UserAPI.getProfile()
      .then((result) => {
        if (result.user.firstname !== this.state.username)
          this.setState({
            username: result.user.firstname
          });
      })
    ;
  }

  handleLogin(e) {
    if (!this.state.username) {
      document.body.dispatchEvent(new CustomEvent("user-dialog", {
        detail: {
          formType: 'login',
          onApproved: () => {
            this.getUsername();
            document.body.dispatchEvent(new CustomEvent("user-change"));
          }
        }
      }));
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
            document.body.dispatchEvent(new CustomEvent("user-dialog", {
              detail: { formType: 'password' }
            }));
            break;
          case 'profile':
            document.body.dispatchEvent(new CustomEvent("user-dialog", {
              detail: {
                formType: 'profile',
                onApproved: () => {
                  this.getUsername();
                }
              }
            }));
            break;
          case 'logout':
            UserAPI.logout().then((result) => {
              this.setState({ username: '' });
              document.body.dispatchEvent(new CustomEvent("user-change"));
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
