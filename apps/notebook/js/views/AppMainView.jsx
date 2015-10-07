import BookshelfContainer from './BookshelfContainer.jsx';
import NoteListContainer from './NoteListContainer.jsx';
import NoteEditorContainer from './NoteEditorContainer.jsx';

export default class AppMainView extends React.Component {
  render() {
    return (
      <div className="nb-main-view">
        <div className="ui equal height grid nb-main-grid">
          <div className="sixteen wide mobile six wide tablet three wide computer red column nb-main-eq-h-row">
            <BookshelfContainer />
          </div>
          <div className="sixteen wide mobile six wide tablet four wide computer blue column nb-main-eq-h-row">
            <NoteListContainer />
          </div>
          <div className="sixteen wide mobile ten wide tablet nine wide computer green column nb-main-eq-h-row">
            <NoteEditorContainer takeSnapshot={false} />
          </div>
        </div>
      </div>
    );
  }
}
