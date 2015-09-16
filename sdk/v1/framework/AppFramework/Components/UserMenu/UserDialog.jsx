import Dialog from 'lib/cutie/Dialog';
import LoginForm from './LoginForm.jsx';
import SignupForm from './SignupForm.jsx';
import ProfileForm from './ProfileForm.jsx';
import PasswordForm from './PasswordForm.jsx';
import CongratsView from './CongratsView.jsx';

export default class LoginView extends React.Component {

  static defaultProps = {
    formType: 'login', // 'signup', 'profile', 'password', 'auth'
    onSuccess: () => {}
  };

  constructor(props) {
    super(props);
    this.state = {
      formType: props.formType,
      congrats: false,
      waiting: false
    };
  }

  componentDidMount() {
    this.refs.userDialog.show();
  }

  onLoginSuccess() {
    this.refs.userDialog.hide();
    this.props.onSuccess();
    this.setState({ waiting: false });
  }

  onSignupSuccess() {
    this.setState({ congrats: true, waiting: false });
  }

  onProfileSuccess() {
    this.props.onSuccess();
    this.setState({ congrats: true, waiting: false });
  }

  onPasswordSuccess() {
    this.props.onSuccess();
    this.setState({ congrats: true, waiting: false });
  }

  onValidate(formData) {
    this.setState({ waiting: true });
  }

  onFailure() {
    this.setState({ waiting: false });
  }

  render() {
    var loginForm = <LoginForm
                      ref="loginForm"
                      onValidate={this.onValidate.bind(this)}
                      onSuccess={this.onLoginSuccess.bind(this)}
                      onFailure={this.onFailure.bind(this)}
                    />;
    var dialogView, title, buttons;

    if (this.state.congrats) {
      if (this.state.formType === 'signup') {
        dialogView = <CongratsView message='Thank you for registering!' />;
        title = 'Signup successfully';
        buttons = [
          {
            title: 'Login',
            iconType: '',
            color: 'green',
            actionType: '',
            onClick: (e) => { this.setState({ formType: 'login', congrats: false }) }
          },
          { classes: 'hidden' }
        ];
      }
      else if (this.state.formType === 'profile') {
        dialogView = <CongratsView message='Your profile is updated!' />;
        title = 'Profile update successfully';
        buttons = [
          {
            title: 'Done',
            iconType: '',
            color: 'green',
            actionType: 'deny'
          },
          { classes: 'hidden' }
        ];
      }
      else if (this.state.formType === 'password') {
        dialogView = <CongratsView message='Your password is changed!' />;
        title = 'Password change successfully';
        buttons = [
          {
            title: 'Done',
            iconType: '',
            color: 'green',
            actionType: 'deny'
          },
          { classes: 'hidden' }
        ];
      }
    }
    else if (this.state.formType === 'login') {
      dialogView = loginForm;
      title = 'Log in to your account';
      buttons = [
        {
          title: 'Sign up',
          iconType: '',
          color: '',
          actionType: '',
          onClick: () => { this.setState({ formType: 'signup' }) }
        },
        {
          title: 'Log in',
          iconType: 'sign in',
          color: 'green',
          classes: this.state.waiting ? 'loading' : '',
          actionType: this.state.waiting ? '' : 'approve'
        }
      ];
    }
    else if (this.state.formType === 'auth') {
      dialogView = loginForm;
      title = 'Authorization required';
      buttons = [
        {
          classes: 'hidden'
        },
        {
          title: 'Log in',
          iconType: 'sign in',
          color: 'green',
          classes: this.state.waiting ? 'loading' : '',
          actionType: this.state.waiting ? '' : 'approve'
        }
      ];
    }
    else if (this.state.formType === 'signup') {
      dialogView = <SignupForm
                    ref="signupForm"
                    onValidate={this.onValidate.bind(this)}
                    onSuccess={this.onSignupSuccess.bind(this)}
                    onFailure={this.onFailure.bind(this)}
                  />;
      title = 'Create your account';
      buttons = [
        {
          title: 'Back to log in',
          iconType: '',
          color: '',
          actionType: '',
          onClick: () => { this.setState({ formType: 'login' }) }
        },
        {
          title: 'Sign up',
          iconType: 'sign in',
          color: 'green',
          classes: this.state.waiting ? 'loading' : '',
          actionType: this.state.waiting ? '' : 'approve'
        }
      ];
    }
    else if (this.state.formType === 'profile') {
      dialogView = <ProfileForm
                    ref="profileForm"
                    onValidate={this.onValidate.bind(this)}
                    onSuccess={this.onProfileSuccess.bind(this)}
                    onFailure={this.onFailure.bind(this)}
                  />;
      title = 'Edit your profile';
      buttons = [
        {
          title: 'Cancel',
          iconType: '',
          color: '',
          actionType: 'deny'
        },
        {
          title: 'Save',
          iconType: 'save',
          color: 'green',
          classes: this.state.waiting ? 'loading' : '',
          actionType: this.state.waiting ? '' : 'approve'
        }
      ];
    }
    else if (this.state.formType === 'password') {
      dialogView = <PasswordForm
                    ref="passwordForm"
                    onValidate={this.onValidate.bind(this)}
                    onSuccess={this.onPasswordSuccess.bind(this)}
                    onFailure={this.onFailure.bind(this)}
                  />;
      title = 'Change your password';
      buttons = [
        {
          title: 'Cancel',
          iconType: '',
          color: '',
          actionType: 'deny'
        },
        {
          title: 'Save',
          iconType: 'save',
          color: 'green',
          classes: this.state.waiting ? 'loading' : '',
          actionType: this.state.waiting ? '' : 'approve'
        }
      ];
    }

    return (
      <Dialog
        ref="userDialog"
        closable={ true }
        headerIcon="circular user"
        title={ title }
        customView={ dialogView }
        actionButtons={ buttons }
        onApprove={ () => {
          if (this.state.formType === 'login' || this.state.formType === 'auth')
            this.refs.loginForm.submit();
          else if (this.state.formType === 'signup')
            this.refs.signupForm.submit();
          else if (this.state.formType === 'profile')
            this.refs.profileForm.submit();
          else if (this.state.formType === 'password')
            this.refs.passwordForm.submit();
          return false;
        }}
        onShow={ () => {
          if (this.state.formType === 'login' || this.state.formType === 'auth')
            this.refs.loginForm.focus();
          else if (this.state.formType === 'signup')
            this.refs.signupForm.focus();
          else if (this.state.formType === 'profile')
            this.refs.profileForm.focus();
          else if (this.state.formType === 'password')
            this.refs.passwordForm.focus();
        }}
      />
    );
  }
}
