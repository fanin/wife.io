import classnames from 'classnames';
import * as Dialog from 'lib/cutie/Dialog';
import Button from 'lib/cutie/Button';
import Form from 'lib/cutie/Form';
import Input from 'lib/cutie/Input';
import UserAPI from 'lib/api/UserAPI';

export default class DialogGroupUpdater extends React.Component {

  static defaultProps = {
    onValidate: (form) => {},
    onSuccess: () => {},
    onFailure: (error) => {},
    onHidden: () => {}
  };

  constructor(props) {
    super(props);
    this.state = {
      name: '',
      description: '',
      waiting: false
    };
    this.validateRules = {
      rule1: {
        identifier: 'newname',
        rules: [
          {
            type: 'empty',
            prompt: 'Please enter a group name'
          }
        ]
      }
    };
  }

  componentDidMount() {
    //this.show();
  }

  componentWillUnmount() {
    //this.hide();
  }

  show(group) {
    this.setState({ name: group.name, description: group.description });
    this.refs.groupUpdateDialog.show();
  }

  hide() {
    this.refs.groupUpdateDialog.hide();
  }

  render() {
    let title = '';

    let buttons = [
      {
        title: 'Cancel',
        iconType: '',
        color: '',
        actionType: 'deny'
      },
      {
        title: 'Save',
        iconType: '',
        color: 'green',
        classes: this.state.waiting ? 'loading' : '',
        actionType: this.state.waiting ? '' : 'approve'
      }
    ];

    return (
      <Dialog.Container
        ref="groupUpdateDialog"
        closable={true}
        onApprove={ () => {
          this.refs.updateForm.submit();
          return false;
        }}
        onVisible={ () => {
          this.refs.updateForm.focus();
        }}
        onHidden={this.props.onHidden}
      >
        <Dialog.Header icon="circular users">
          Update group
        </Dialog.Header>
        <Dialog.Content>
          <Form
            ref="updateForm"
            preventDefaultSubmit={true}
            fields={this.validateRules}
            onValidate={(error, formData) => {
              this.setState({ waiting: true });
              this.props.onValidate(formData);

              if (error) {
                this.props.onFailure(error);
                this.setState({ waiting: false });
              }
              else {
                UserAPI.renameGroup(formData)
                  .then(() => {
                    this.setState({ waiting: false });
                    this.props.onSuccess();
                  })
                  .catch((error) => {
                    this.refs.updateForm.addError([ error.message ]);
                    this.setState({ waiting: false });
                    this.props.onFailure(error);
                  })
                ;
              }
            }}
          >
            <Input
              type="text"
              name="oldname"
              classes="hidden"
              defaultValue={this.state.name}
              readonly={true}
            />
            <div className="field">
              <label>Group name</label>
              <Input
                type="text"
                name="newname"
                defaultValue={this.state.name}
                readonly={(this.state.name === 'Admin' || this.state.name === 'User')}
              />
            </div>
            <div className="field">
              <label>Description</label>
              <Input
                type="text"
                name="description"
                defaultValue={this.state.description}
              />
            </div>
            <div className="ui error message" />
          </Form>
        </Dialog.Content>
        <Dialog.ButtonSet>
          <Button classes="deny">
            Cancel
          </Button>
          <Button
            color="green"
            classes={classnames("approve", { loading: this.state.waiting })}
          >
            Save
          </Button>
        </Dialog.ButtonSet>
      </Dialog.Container>
    );
  }
}
