import { Intent, Position, Toaster } from '@blueprintjs/core'
import { Container } from 'botpress/ui'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import React from 'react'

import { EditableFile, FilesDS, FileType } from '../../backend/typings'

import SplashScreen from './components/SplashScreen'
import { baseAction, baseHook } from './utils/templates'
import Editor from './Editor'
import SidePanel from './SidePanel'
const FILENAME_REGEX = /^[0-9a-zA-Z_\-.]+$/

export default class CodeEditor extends React.Component<Props, State> {
  state = {
    errors: undefined,
    files: undefined,
    isEditing: false,
    editedContent: undefined,
    selectedFile: undefined,
    isGlobalAllowed: false
  }

  componentDidMount() {
    // tslint:disable-next-line: no-floating-promises
    this.initialize()
    document.addEventListener('keydown', this.createNewFileShortcut)
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.createNewFileShortcut)
  }

  createNewFileShortcut = e => {
    // The editor normally handles keybindings, so this one is only active while it is closed
    if (e.ctrlKey && e.altKey && e.key === 'n' && !this.state.selectedFile) {
      this.createFilePrompt('action')
    }
  }

  async initialize() {
    const { data: files } = await this.props.bp.axios.get('/mod/code-editor/files')
    const { data: config } = await this.props.bp.axios.get('/mod/code-editor/config')
    this.setState({ files, ...config })
  }

  createFilePrompt = (type: FileType, isGlobal?: boolean, hookType?: string) => {
    let name = window.prompt(`Choose the name of your ${type}. No special chars. Use camel case`)
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
        content: type === 'action' ? baseAction : baseHook,
        type,
        hookType,
        botId: isGlobal ? undefined : window.BOT_ID
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

  removeFile = async (file: EditableFile) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      await this.props.bp.axios.post('/mod/code-editor/remove', file)
      await this.initialize()
    }
  }

  renameFile = async (file, newName) => {
    try {
      await this.props.bp.axios.put('/mod/code-editor/rename', { file, newName })
    } catch (e) {
      if (e.response && e.response.status === 409) {
        Toaster.create({ className: 'recipe-toaster', position: Position.TOP }).show({
          message: `File with name "${newName} already exists in the same location"`,
          intent: Intent.DANGER,
          timeout: 2000
        })
      }
      if (e.response && e.response.status === 412) {
        Toaster.create({ className: 'recipe-toaster', position: Position.TOP }).show({
          message: `Name "${newName} is invalid"`,
          intent: Intent.DANGER,
          timeout: 2000
        })
      }
      throw e
    }
    await this.initialize()
  }

  handleFileChanged = selectedFile => this.setState({ isEditing: false, selectedFile })
  handleContentChanged = (editedContent, hasChanges) => this.setState({ isEditing: hasChanges, editedContent })
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
      <Container>
        <SidePanel
          errors={this.state.errors}
          isEditing={this.state.isEditing}
          files={this.state.files}
          handleFileChanged={this.handleFileChanged}
          createFilePrompt={this.createFilePrompt}
          discardChanges={this.handleDiscardChanges}
          onSaveClicked={this.saveChanges}
          isGlobalAllowed={this.state.isGlobalAllowed}
          removeFile={this.removeFile}
          renameFile={this.renameFile}
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
      </Container>
    )
  }
}

interface Props {
  bp: any
}

interface State {
  files: FilesDS
  selectedFile: EditableFile
  isEditing: boolean
  editedContent: string
  errors: monaco.editor.IMarker[]
}
