import Editor from './Editor'

import { baseAction } from './utils/templates'
import SplashScreen from './SplashScreen'
import SidePanel from './SidePanel'

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
    if (this.state.isEditing && this.state.editedContent) {
      if (window.confirm(`Do you want to save the changes you made to ${this.state.selectedFile.name}?`)) {
        await this.saveChanges()
      }
    }

    this.setState({ isEditing: false, selectedFile: undefined })
  }

  render() {
    return (
      <div style={{ display: 'flex', background: '#21252B' }}>
        <SidePanel
          errors={this.state.errors}
          isEditing={this.state.isEditing}
          files={this.state.files}
          handleFileChanged={this.handleFileChanged}
          createFilePrompt={this.createFilePrompt}
        />
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
