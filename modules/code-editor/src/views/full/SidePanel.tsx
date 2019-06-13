import { Icon } from '@blueprintjs/core'
import { SidePanel, SidePanelSection } from 'botpress/ui'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import React from 'react'

import { EditableFile } from '../../backend/typings'
import { HOOK_SIGNATURES } from '../../typings/hooks'

import FileStatus from './components/FileStatus'
import FileNavigator from './FileNavigator'

export default class PanelContent extends React.Component<Props> {
  private expandedNodes = {}

  state = {
    actionFiles: [],
    hookFiles: []
  }

  componentDidMount() {
    this.updateFolders()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.files !== this.props.files) {
      this.updateFolders()
    }
  }

  updateFolders() {
    if (!this.props.files) {
      return
    }

    const { actionsBot, actionsGlobal, hooksGlobal } = this.props.files

    const actionFiles = []
    actionsBot && actionFiles.push({ label: `Bot (${window['BOT_NAME']})`, files: actionsBot })
    actionsGlobal && actionFiles.push({ label: 'Global', files: actionsGlobal })

    const hookFiles = [hooksGlobal && { label: 'Global', files: hooksGlobal }]

    this.setState({ actionFiles, hookFiles })
  }

  updateNodeState = (id: string, isExpanded: boolean) => {
    if (isExpanded) {
      this.expandedNodes[id] = true
    } else {
      delete this.expandedNodes[id]
    }
  }

  renderSectionActions() {
    const items = [
      {
        label: 'Action - Bot',
        icon: <Icon icon="new-text-box" />,
        onClick: () => this.props.createFilePrompt('action', false)
      }
    ]

    if (this.props.isGlobalAllowed) {
      items.push({
        label: 'Action - Global',
        icon: <Icon icon="new-text-box" />,
        onClick: () => this.props.createFilePrompt('action', true)
      })
    }

    return (
      <SidePanelSection label={'Actions'} actions={[{ icon: <Icon icon="add" />, items }]}>
        <FileNavigator
          files={this.state.actionFiles}
          expandedNodes={this.expandedNodes}
          onNodeStateChanged={this.updateNodeState}
          onFileSelected={this.props.handleFileChanged}
        />
      </SidePanelSection>
    )
  }

  renderSectionHooks() {
    const items = Object.keys(HOOK_SIGNATURES).map(hookType => ({
      label: hookType
        .split('_')
        .map(x => x.charAt(0).toUpperCase() + x.slice(1))
        .join(' '),
      onClick: () => this.props.createFilePrompt('hook', true, hookType)
    }))

    return (
      <SidePanelSection label={'Hooks'} actions={[{ icon: <Icon icon="add" />, items }]}>
        <FileNavigator
          files={this.state.hookFiles}
          expandedNodes={this.expandedNodes}
          onNodeStateChanged={this.updateNodeState}
          onFileSelected={this.props.handleFileChanged}
        />
      </SidePanelSection>
    )
  }

  render() {
    return (
      <SidePanel>
        {this.props.isEditing && (
          <FileStatus
            errors={this.props.errors}
            onSaveClicked={this.props.onSaveClicked}
            discardChanges={this.props.discardChanges}
          />
        )}

        {!this.props.isEditing && this.renderSectionActions()}
        {!this.props.isEditing && this.props.isGlobalAllowed && this.renderSectionHooks()}
      </SidePanel>
    )
  }
}

interface Props {
  isEditing: boolean
  isGlobalAllowed: boolean
  files: any
  errors: monaco.editor.IMarker[]
  handleFileChanged: (file: EditableFile) => void
  discardChanges: () => void
  createFilePrompt: (type: string, isGlobal?: boolean, hookType?: string) => void
  onSaveClicked: () => void
}
