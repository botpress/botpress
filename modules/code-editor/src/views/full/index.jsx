import Editor from './Editor'
import Navigator from './Navigator'
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { baseAction } from './utils/templates'
import style from './style.scss'
import { FiFilePlus } from 'react-icons/fi'
import SplashScreen from './SplashScreen'

const FILENAME_REGEX = /^[0-9a-zA-Z_\-.]+$/

export default class CodeEditor extends React.Component {
  state = {
    files: undefined,
    isEditing: false,
    editedContent: undefined,
    selectedFile: undefined
  }

  componentDidMount() {
    this.initialize()
  }

  async initialize() {
    const { data: files } = await this.props.bp.axios.get('/mod/code-editor/files')
    this.setState({ files })
  }

  createFilePrompt = () => {
    let name = window.prompt('Choose the name of your action. No special chars. Use camel case')
    if (!name) {
      return
    }

    if (!FILENAME_REGEX.test(name)) {
      alert('Invalid filename')
    }

    this.setState({
      isEditing: true,
      selectedFile: {
        name: name.endsWith('.js') ? name : name + '.js',
        content: baseAction,
        type: 'action',
        botId: window.BOT_ID
      }
    })
  }

  saveChanges = async () => {
    await this.props.bp.axios.post('/mod/code-editor/save', {
      ...this.state.selectedFile,
      content: this.state.editedContent
    })

    this.setState({ isEditing: false }, this.initialize)
  }

  handleFileChanged = selectedFile => this.setState({ isEditing: false, askConfirmDiscard: false, selectedFile })
  handleContentChanged = (editedContent, errors) => {
    this.setState({
      isEditing: true,
      editedContent,
      errorCount: errors.length,
      errors: errors.map(x => x.message)
    })
  }

  renderEditing() {
    const { selectedFile, errors } = this.state
    return (
      <div style={{ padding: 10 }}>
        <div className={style.status}>
          Currently editing: <strong> {selectedFile && selectedFile.name}</strong>
          <br />
          {errors && !!errors.length && `There are ${errors.length} errors in your file.`}
        </div>
        <br />
        &nbsp;
        {this.state.askConfirmDiscard ? (
          <Button
            bsSize="small"
            bsStyle="danger"
            onClick={() => this.setState({ isEditing: false, selectedFile: undefined })}
          >
            Are you sure?
          </Button>
        ) : (
          <Button bsSize="small" bsStyle="danger" onClick={() => this.setState({ askConfirmDiscard: true })}>
            Discard
          </Button>
        )}
      </div>
    )
  }

  render() {
    return (
      <div style={{ display: 'flex', background: '#21252B' }}>
        <div style={{ width: 300 }}>
          <div className={style.section}>
            <strong>Actions</strong>
            <div>
              <OverlayTrigger placement="top" overlay={<Tooltip>New action</Tooltip>}>
                <a className={style.btn} onClick={this.createFilePrompt}>
                  <FiFilePlus />
                </a>
              </OverlayTrigger>
            </div>
          </div>
          {this.state.isEditing ? (
            this.renderEditing()
          ) : (
            <Navigator files={this.state.files} onFileSelected={this.handleFileChanged} />
          )}
        </div>
        {this.state.selectedFile && (
          <Editor
            bp={this.props.bp}
            selectedFile={this.state.selectedFile}
            onContentChanged={this.handleContentChanged}
            onSaveClicked={this.saveChanges}
            onCreateNewClicked={this.createFilePrompt}
          />
        )}
        {!this.state.selectedFile && <SplashScreen />}
      </div>
    )
  }
}
