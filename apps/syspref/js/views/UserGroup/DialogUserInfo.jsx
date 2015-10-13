import classnames from 'classnames';
import * as Dialog from 'lib/cutie/Dialog';
import Form from 'lib/cutie/Form';
import Input from 'lib/cutie/Input';
import Dropdown from 'lib/cutie/Dropdown';
import UserAPI from 'lib/api/UserAPI';

export class UserInfoForm extends React.Component {

  static defaultProps = {
    email: ''
  };

  constructor(props) {
    super(props);
    this.state = {
      email: '',
      firstname: '',
      lastname: '',
      group: '',
      gender: '',
      note: '',
      groups: []
    };
  }

  componentDidMount() {
    if (this.props.email) {
      Promise.all([
        UserAPI.getGroups(),
        UserAPI.getProfile({ user: this.props.email })
      ]).then((values) => {
        this.setState({
          email: values[1].user.email,
          firstname: values[1].user.firstname,
          lastname: values[1].user.lastname,
          group: values[1].user.group,
          gender: values[1].user.gender,
          note: values[1].user.note,
          groups: values[0].groups
        });
      });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.email !== this.props.email && this.props.email != '') {
      Promise.all([
        UserAPI.getGroups(),
        UserAPI.getProfile({ user: this.props.email })
      ]).then((values) => {
        this.setState({
          email: values[1].user.email,
          firstname: values[1].user.firstname,
          lastname: values[1].user.lastname,
          group: values[1].user.group,
          gender: values[1].user.gender,
          note: values[1].user.note,
          groups: values[0].groups
        });
      });
    }
  }

  render() {
    let groupItems = this.state.group.split(',').map(
      (group) => <div key={group} className="item" data-value={group}>{group}</div>
    );

    return (
      <Form preventDefaultSubmit={true}>
        <div className="field" style={{ margin: '0 0 3em' }}>
          <img
            className="ui centered small circular image"
            src="/img/guest-avatar.jpg"
          />
        </div>
        <div className="field" style={{ margin: '0 0 1em' }}>
          <label>E-Mail</label>
          <Input
            readonly={true}
            type="text"
            name="email"
            defaultValue={this.state.email}
          />
        </div>
        <div className="two fields">
          <div className="field">
            <label>First Name</label>
            <Input
              readonly={true}
              type="text"
              name="firstname"
              defaultValue={this.state.firstname}
            />
          </div>
          <div className="field">
            <label>Last Name</label>
            <Input
              readonly={true}
              type="text"
              name="lastname"
              defaultValue={this.state.lastname}
            />
          </div>
        </div>
        <div className="fields">
          <div className="ten wide field">
            <label>Group</label>
            <Dropdown
              readonly={true}
              name="group"
              type="multiple selection"
              selectHintText="Group"
              selectDefaultValue={this.state.group}
            >
              {groupItems}
            </Dropdown>
          </div>
          <div className="six wide field">
            <label>Gender</label>
            <Input
              readonly={true}
              type="text"
              name="gender"
              defaultValue={this.state.gender ? 'Male' : 'Female'}
            />
          </div>
        </div>
        <div className="field">
            <label>Note</label>
            <Input
              readonly={true}
              type="text"
              name="note"
              defaultValue={this.state.note}
            />
          </div>
        <div className="ui error message" />
      </Form>
    );
  }
}

export default class DialogUserInfo extends React.Component {

  static defaultProps = {
    onHidden: () => {}
  };

  constructor(props) {
    super(props);
    this.state = {
      email: ''
    };
  }

  show(email) {
    this.setState({ email: email });
    this.refs.userInfoDialog.show();
  }

  hide() {
    this.refs.userInfoDialog.hide();
  }

  render() {
    return (
      <Dialog.Container
        ref="userInfoDialog"
        closable={true}
        onHidden={this.props.onHidden}
      >
        <Dialog.Header icon="circular user">
          {this.state.email}
        </Dialog.Header>
        <Dialog.Content>
          <UserInfoForm email={this.state.email} />
        </Dialog.Content>
      </Dialog.Container>
    );
  }
}
