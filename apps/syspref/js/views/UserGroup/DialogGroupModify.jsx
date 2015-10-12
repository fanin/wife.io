import classnames from 'classnames';
import * as Dialog from 'lib/cutie/Dialog';
import Button from 'lib/cutie/Button';
import Form from 'lib/cutie/Form';
import Input from 'lib/cutie/Input';
import UserAPI from 'lib/api/UserAPI';

export default class DialogGroupModify extends React.Component {

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
    this.refs.groupModifyDialog.show();
  }

  hide() {
    this.refs.groupModifyDialog.hide();
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
        ref="groupModifyDialog"
        closable={true}
        onApprove={ () => {
          this.refs.modifyForm.submit();
          return false;
        }}
        onVisible={ () => {
          this.refs.modifyForm.focus();
        }}
        onHidden={this.props.onHidden}
      >
        <Dialog.Header icon="circular users">
          Modify group name
        </Dialog.Header>
        <Dialog.Content>
          <Form
            ref="modifyForm"
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
                    this.refs.modifyForm.addError([ error.message ]);
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
