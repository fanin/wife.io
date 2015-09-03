import LoginDialog from 'lib/cutie/Dialog';
import LoginForm from './LoginForm.jsx';
import SignupForm from './SignupForm.jsx';
import UserAPI from 'lib/api/UserAPI';

export default class LoginView extends React.Component {

  static defaultProps = {
    title: '',
    signup: false,
    onSuccess: () => {}
  };

  constructor(props) {
    super(props);
    this.state = {
      signup: false
    };
  }

  componentDidMount() {
    this.refs.loginDialog.show();
  }

  componentDidUpdate(prevProps, prevState) {
    this.refs.loginDialog.show();
  }

  onLoginSubmit(formData) {
    UserAPI.login(formData)
    .then(() => {
      this.refs.loginDialog.hide();
      this.props.onSuccess();
    })
    .catch((err) => {
      console.log('Login failed', err);
    });
  }

  onSignupSubmit(formData) {
    UserAPI.signup(formData)
    .then(() => {
      this.setState({ signup: false });
    })
    .catch((err) => {
      console.log('Signup failed', err);
    });
  }

  render() {
    var loginForm =
      <LoginForm ref="loginForm" onSubmit={this.onLoginSubmit.bind(this)} />;
    var signupForm =
      <SignupForm ref="signupForm" onSubmit={this.onSignupSubmit.bind(this)} />;

    var title = this.state.signup ? 'Create your account' : 'Log in to account';
    var buttons = this.state.signup ? [
      {
        title: 'Back to log in',
        iconType: '',
        color: '',
        actionType: '',
        onClick: () => { this.setState({ signup: false }) }
      },
      {
        title: 'Sign up',
        iconType: 'sign in',
        color: 'green',
        actionType: 'approve'
      }
    ] : [
      {
        title: this.props.signup ? 'Sign up' : 'Cancel',
        iconType: '',
        color: '',
        actionType: '',
        onClick: () => {
          if (this.props.signup)
            this.setState({ signup: true })
          else
            this.refs.loginDialog.hide();
        }
      },
      {
        title: 'Log in',
        iconType: 'sign in',
        color: 'green',
        actionType: 'approve'
      }
    ];

    return (
      <div>
        <LoginDialog
          ref="loginDialog"
          title={ this.props.title || title }
          customView={ this.state.signup ? signupForm : loginForm }
          actionButtons={ buttons }
          onApprove={ () => {
            if (this.state.signup)
              this.refs.signupForm.submit();
            else
              this.refs.loginForm.submit();
            return false;
          }}
          onShow={ () => {
            if (this.state.signup)
              this.refs.signupForm.focus();
            else
              this.refs.loginForm.focus();
          }}
        />
      </div>
    );
  }
}
