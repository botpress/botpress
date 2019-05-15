import React from 'react'
import { MdExpandLess, MdExpandMore } from 'react-icons/md'
import { FiFilePlus } from 'react-icons/fi'
import { OverlayTrigger, Tooltip, Collapse } from 'react-bootstrap'

import FileNavigator from './FileNavigator'
import style from './style.scss'
import { ACTION_KEY } from './utils/hotkey'

export default class SidePanel extends React.Component {
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
        <Collapse in={this.state.showErrors} timeout={50}>
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
    return (
      <div className={style.sidePanel}>
        <div className={style.section}>
          <strong>Actions</strong>
          <div>
            <OverlayTrigger placement="top" overlay={<Tooltip>New action</Tooltip>}>
              <a className={style.btn} onClick={this.props.createFilePrompt}>
                <FiFilePlus />
              </a>
            </OverlayTrigger>
          </div>
        </div>
        {this.props.isEditing ? (
          this.renderEditing()
        ) : (
          <FileNavigator files={this.props.files} onFileSelected={this.props.handleFileChanged} />
        )}
      </div>
    )
  }
}
