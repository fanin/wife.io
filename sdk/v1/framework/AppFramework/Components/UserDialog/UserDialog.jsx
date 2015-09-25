import classnames from 'classnames';
import * as Dialog from 'lib/cutie/Dialog';
import Button from 'lib/cutie/Button';
import LoginForm from './LoginForm.jsx';
import SignupForm from './SignupForm.jsx';
import ProfileForm from './ProfileForm.jsx';
import PasswordForm from './PasswordForm.jsx';
import MessageView from './MessageView.jsx';


export default class UserDialog extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      formType: 'login', // 'signup', 'profile', 'password', 'auth', 'admpriv'
      congrats: false,
      waiting: false,
      onApproved: () => {},
      onDenied: () => {}
    };
  }

  show(formType, onApproved, onDenied) {
    if (formType)
      this.setState({
        formType: formType,
        onApproved: onApproved,
        onDenied: onDenied
      });

    this.refs.dialog.show();
  }

  onLoginSuccess() {
    this.refs.dialog.hide();
    this.state.onApproved();
    this.setState({ waiting: false });
  }

  onSignupSuccess() {
    this.setState({ congrats: true, waiting: false });
  }

  onProfileSuccess() {
    this.state.onApproved();
    this.setState({ congrats: true, waiting: false });
  }

  onPasswordSuccess() {
    this.state.onApproved();
    this.setState({ congrats: true, waiting: false });
  }

  onValidate(formData) {
    this.setState({ waiting: true });
  }

  onFailure() {
    this.setState({ waiting: false });
  }

  render() {
    let dialogProps = {
      closable: true,
      onShow: () => {
        /*
        if (this.state.formType === 'login' || this.state.formType === 'auth')
          this.refs.loginForm.focus();
        else if (this.state.formType === 'signup')
          this.refs.signupForm.focus();
        else if (this.state.formType === 'profile')
          this.refs.profileForm.focus();
        else if (this.state.formType === 'password')
          this.refs.passwordForm.focus();
        */
      },
      onHide: () => {},
      onHidden: () => {
        // Must reset state after dialog has been unmounted to make sure
        // dialog content reset to default views
        this.setState({
          formType: 'login',
          congrats: false,
          waiting: false
        });
      },
      onApprove: () => {
        if (this.state.formType === 'login' || this.state.formType === 'auth')
          this.refs.loginForm.submit();
        else if (this.state.formType === 'signup')
          this.refs.signupForm.submit();
        else if (this.state.formType === 'profile')
          this.refs.profileForm.submit();
        else if (this.state.formType === 'password')
          this.refs.passwordForm.submit();
        return false;
      },
      onDeny: () => {
        if (this.state.formType === 'login') {
          this.setState({ formType: 'signup' });
          return false;
        }
        else if (this.state.formType === 'signup') {
          if (this.state.congrats)
            this.setState({ formType: 'login', congrats: false });
          else
            this.setState({ formType: 'login' });
          return false;
        }
        return true;
      }
    };

    let loginForm = (
      <LoginForm
        ref="loginForm"
        onValidate={this.onValidate.bind(this)}
        onSuccess={this.onLoginSuccess.bind(this)}
        onFailure={this.onFailure.bind(this)}
      />
    );

    let dialogView, title, buttons;

    if (this.state.congrats) {
      if (this.state.formType === 'signup') {
        dialogView = (
          <MessageView
            icon="green checkmark box"
            message="Thank you for registering!"
          />
        );
        title = 'Signup successfully';
        buttons = [
          <Button
            key="congrate-signup-login"
            color="green"
            classes="deny"
          >
            Log in now
          </Button>
        ];
      }
      else if (this.state.formType === 'profile') {
        dialogView = (
          <MessageView
            icon="green checkmark box"
            message='Your profile is updated!'
          />
        );
        title = 'Profile update successfully';
        buttons = [
          <Button key="congrate-profile-done" color="green" classes="deny">
            Done
          </Button>
        ];
      }
      else if (this.state.formType === 'password') {
        dialogView = (
          <MessageView
            icon="green checkmark box"
            message='Your password is changed!'
          />
        );
        title = 'Password change successfully';
        buttons = [
          <Button key="congrate-password-done" color="green" classes="deny">
            Done
          </Button>
        ];
      }
    }
    else if (this.state.formType === 'login') {
      dialogView = loginForm;
      title = 'Log in to your account';
      buttons = [
        <Button key="login-signup" classes="deny">
          Sign up
        </Button>,
        <Button
          key="login-login"
          style="labeled icon"
          color="green"
          icon="sign in"
          classes={classnames("approve", { loading: this.state.waiting })}
        >
          Log in
        </Button>
      ];
    }
    else if (this.state.formType === 'auth') {
      dialogView = loginForm;
      title = 'Authorization required';
      buttons = [
        <Button
          key="auth-login"
          style="labeled icon"
          color="green"
          icon="sign in"
          classes={classnames("approve", { loading: this.state.waiting })}
        >
          Log in
        </Button>
      ];
    }
    else if (this.state.formType === 'signup') {
      dialogView = (
        <SignupForm
          ref="signupForm"
          onValidate={this.onValidate.bind(this)}
          onSuccess={this.onSignupSuccess.bind(this)}
          onFailure={this.onFailure.bind(this)}
        />
      );
      title = 'Create your account';
      buttons = [
        <Button key="signup-back" classes="deny">
          Back to log in
        </Button>,
        <Button
          key="signup-signup"
          style="labeled icon"
          color="green"
          icon="sign in"
          classes={classnames("approve", { loading: this.state.waiting })}
        >
          Sign up
        </Button>
      ];
    }
    else if (this.state.formType === 'profile') {
      dialogView = (
        <ProfileForm
          ref="profileForm"
          onValidate={this.onValidate.bind(this)}
          onSuccess={this.onProfileSuccess.bind(this)}
          onFailure={this.onFailure.bind(this)}
        />
      );
      title = 'Edit your profile';
      buttons = [
        <Button key="profile-cancel" style="" color="" classes="deny">
          Cancel
        </Button>,
        <Button
          key="profile-save"
          style="labeled icon"
          color="green"
          icon="save"
          classes={classnames("approve", { loading: this.state.waiting })}
        >
          Save
        </Button>
      ];
    }
    else if (this.state.formType === 'password') {
      dialogView = (
        <PasswordForm
          ref="passwordForm"
          onValidate={this.onValidate.bind(this)}
          onSuccess={this.onPasswordSuccess.bind(this)}
          onFailure={this.onFailure.bind(this)}
        />
      );
      title = 'Change your password';
      buttons = [
        <Button key="password-cancel" style="" color="" classes="deny">
          Cancel
        </Button>,
        <Button
          key="password-save"
          style="labeled icon"
          color="green"
          icon="save"
          classes={classnames("approve", { loading: this.state.waiting })}
        >
          Save
        </Button>
      ];
    }
    else if (this.state.formType === 'admpriv') {
      dialogView = (
        <MessageView
          icon="red minus circle"
          message='Administrative privilege required.'
        />
      );
      title = 'Access denied';
      buttons = [
        <Button key="admpriv-ok" style="" color="green" icon="" classes="deny">
          OK
        </Button>
      ];
    }

    return (
      <Dialog.Container {...dialogProps} ref="dialog">
        <Dialog.Header icon="circular user">{title}</Dialog.Header>
        <Dialog.Content>
          {dialogView}
        </Dialog.Content>
        <Dialog.ButtonSet>
          {buttons}
        </Dialog.ButtonSet>
      </Dialog.Container>
    );
  }
}
