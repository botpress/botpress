import Editor from './Editor'
import Navigator from './Navigator'
import { Button, OverlayTrigger, Tooltip, Collapse } from 'react-bootstrap'

import { baseAction } from './utils/templates'
import style from './style.scss'
import { MdExpandLess, MdExpandMore } from 'react-icons/md'
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
    document.addEventListener('keydown', this.createNewFileShortcut)
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.createNewFileShortcut)
  }

  createNewFileShortcut = e => {
    // The editor normally handles keybindings, so this one is only active while it is closed
    if (e.ctrlKey && e.altKey && e.key === 'n' && !this.state.selectedFile) {
      this.createFilePrompt()
    }
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
      return
    }

    name = name.endsWith('.js') ? name : name + '.js'
    this.setState({
      isEditing: true,
      selectedFile: {
        name,
        location: name,
        content: baseAction,
        type: 'action',
        botId: window.BOT_ID
      }
    })
  }

  saveChanges = async () => {
    if (!this.state.editedContent) {
      return
    }

    await this.props.bp.axios.post('/mod/code-editor/save', {
      ...this.state.selectedFile,
      content: this.state.editedContent
    })

    this.setState({ isEditing: false, editedContent: undefined }, this.initialize)
  }

  handleFileChanged = selectedFile => this.setState({ isEditing: false, askConfirmDiscard: false, selectedFile })
  handleContentChanged = editedContent => this.setState({ isEditing: true, editedContent })
  handleProblemsChanged = errors => this.setState({ errors })

  handleDiscardChanges = async () => {
    if (this.state.editedContent) {
      if (window.confirm(`Do you want to save the changes you made to ${this.state.selectedFile.name}?`)) {
        await this.saveChanges()
      }
    }

    this.setState({ isEditing: false, selectedFile: undefined })
  }

  renderEditing() {
    const { errors } = this.state
    if (!errors || !errors.length) {
      return (
        <div style={{ padding: '5px' }}>
          <small>Tip: Use CTRL+S to save your file</small>
        </div>
      )
    }

    return (
      <div className={style.status}>
        <strong>Warning</strong>
        <br />
        There are {errors.length} errors in your file.
        <br />
        Please make sure to fix them before saving.
        <br />
        <br />
        <span
          onClick={() => {
            this.setState({ displayErrors: !this.state.displayErrors })
          }}
          style={{ cursor: 'pointer' }}
        >
          {this.state.displayErrors && <MdExpandLess />}
          {!this.state.displayErrors && <MdExpandMore />}
          View details
        </span>
        <Collapse in={this.state.displayErrors} timeout={100}>
          <div>
            {errors.map(x => (
              <div style={{ marginBottom: 10 }}>
                Line <strong>{x.startLineNumber}</strong>
                <br />
                {x.message}
              </div>
            ))}
          </div>
        </Collapse>
      </div>
    )
  }

  render() {
    return (
      <div style={{ display: 'flex', background: '#21252B' }}>
        <div style={{ width: 400 }}>
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
            onProblemsChanged={this.handleProblemsChanged}
            onSaveClicked={this.saveChanges}
            onCreateNewClicked={this.createFilePrompt}
            onDiscardChanges={this.handleDiscardChanges}
          />
        )}
        {!this.state.selectedFile && <SplashScreen />}
      </div>
    )
  }
}
