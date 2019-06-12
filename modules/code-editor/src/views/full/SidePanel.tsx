import { Collapse, Icon } from '@blueprintjs/core'
import { SectionAction, SidePanel, SidePanelSection } from 'botpress/ui'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import React from 'react'
import { FiSave } from 'react-icons/fi'
import { MdExpandLess, MdExpandMore } from 'react-icons/md'

import style from './style.scss'
import { ACTION_KEY } from './utils/hotkey'
import FileNavigator from './FileNavigator'

export default class PanelContent extends React.Component<Props> {
  state = {
    showErrors: false
  }

  toggleShowError = () => {
    this.setState({
      showErrors: !this.state.showErrors
    })
  }

  renderEditing = () => {
    const { errors } = this.props
    if (!errors || !errors.length) {
      return (
        <div style={{ padding: '5px' }}>
          <small>
            Tip: Use {ACTION_KEY}
            +S to save your file
          </small>
        </div>
      )
    }

    return (
      <div className={style.status}>
        {/* TODO improve this */}
        <strong>Warning</strong>
        <br />
        There are {errors.length} errors in your file.
        <br />
        Please make sure to fix them before saving.
        <br />
        <br />
        <span onClick={this.toggleShowError} style={{ cursor: 'pointer' }}>
          {this.state.showErrors && <MdExpandLess />}
          {!this.state.showErrors && <MdExpandMore />}
          View details
        </span>
        <Collapse isOpen={this.state.showErrors}>
          <div style={{ paddingLeft: 15 }}>
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
    const actions: SectionAction[] = [
      {
        icon: <Icon icon="add" />,
        items: [{ label: 'Action', icon: <Icon icon="new-text-box" />, onClick: this.props.createFilePrompt }]
      }
    ]

    const editingActions = [{ label: 'Save', icon: <FiSave />, onClick: this.props.onSaveClicked }]
    return (
      <SidePanel>
        {this.props.isEditing && (
          <SidePanelSection label={'Currently editing'} actions={editingActions}>
            {this.renderEditing()}
          </SidePanelSection>
        )}

        <SidePanelSection label={'Actions'} actions={actions}>
          <FileNavigator files={this.props.files} onFileSelected={this.props.handleFileChanged} />
        </SidePanelSection>
      </SidePanel>
    )
  }
}

interface Props {
  isEditing: boolean

  files: any
  errors: monaco.editor.IMarker[]
  handleFileChanged: any
  createFilePrompt: any
  onSaveClicked: () => void
}

interface Error {}
