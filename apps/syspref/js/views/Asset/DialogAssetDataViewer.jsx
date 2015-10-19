import classnames from 'classnames';
import * as Dialog from 'lib/cutie/Dialog';
import Button from 'lib/cutie/Button';
import Form from 'lib/cutie/Form';
import Input from 'lib/cutie/Input';
import UserAPI from 'lib/api/UserAPI';

export default class DialogGroupCreate extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      data: {}
    };
  }

  show(data) {
    this.setState({ data: data });
    this.refs.viewerDialog.show();
  }

  hide() {
    this.refs.viewerDialog.hide();
  }

  render() {
    return (
      <Dialog.Container
        ref="viewerDialog"
        closable={true}
      >
        <Dialog.Header icon="circular laptop">
          Service Additional Data
        </Dialog.Header>
        <Dialog.Content>
          <pre>{JSON.stringify(this.state.data, null, 2)}</pre>
        </Dialog.Content>
        <Dialog.ButtonSet>
          <Button classes="deny">
            Close
          </Button>
        </Dialog.ButtonSet>
      </Dialog.Container>
    );
  }
}
