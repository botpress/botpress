import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap'

import { updateGlobalStyle } from '~/actions'

const style = require('./toolbar.scss')

class Toolbar extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {
    this.props.updateGlobalStyle({
      'bp-navbar': {
        borderBottom: 'none'
      }
    })
  }

  componentWillUnmount() {
    this.props.updateGlobalStyle({
      'bp-navbar': {}
    })
  }

  render() {
    const createTooltip = (name, text) => <Tooltip id={name}>{text}</Tooltip>

    const hasUnsavedChanges = false

    const isInsertNodeMode = this.props.currentDiagramAction === 'insert_node'
    const isInsertSubflowMode = this.props.currentDiagramAction === 'insert_subflow'

    const toggleInsertMode = action => element => {
      this.props.setDiagramAction(this.props.currentDiagramAction === action ? null : action)
    }

    return (
      <div className={style.wrapper}>
        <div className={style.toolbar}>
          <Button className={style.btn} bsStyle="default">
            <OverlayTrigger placement="bottom" overlay={createTooltip('addFlow', 'Create new flow')}>
              <i className="material-icons">create_new_folder</i>
            </OverlayTrigger>
          </Button>

          <Button
            className={style.btn}
            bsStyle="default"
            onClick={() => {
              console.log(this.props)
              this.props.fetchFlows()
            }}
          >
            <OverlayTrigger placement="bottom" overlay={createTooltip('search', 'Search flows')}>
              <i className="material-icons">search</i>
            </OverlayTrigger>
          </Button>

          <div className={style.separator} />

          <Button
            className={style.btn}
            bsStyle="default"
            // disabled={!hasUnsavedChanges}
            onClick={() => this.props.onSaveFlow && this.props.onSaveFlow()}
          >
            <OverlayTrigger placement="bottom" overlay={createTooltip('save', 'Save')}>
              <i className="material-icons">save</i>
            </OverlayTrigger>
          </Button>

          <div className={style.separator} />

          <Button className={style.btn} bsStyle="default">
            <OverlayTrigger placement="bottom" overlay={createTooltip('undo', 'Undo')}>
              <i className="material-icons">undo</i>
            </OverlayTrigger>
          </Button>

          <Button className={style.btn} bsStyle="default">
            <OverlayTrigger placement="bottom" overlay={createTooltip('redo', 'Redo')}>
              <i className="material-icons">redo</i>
            </OverlayTrigger>
          </Button>

          <Button className={style.btn} bsStyle="default">
            <OverlayTrigger placement="bottom" overlay={createTooltip('copy', 'Copy')}>
              <i className="material-icons">content_copy</i>
            </OverlayTrigger>
          </Button>

          <Button className={style.btn} bsStyle="default">
            <OverlayTrigger placement="bottom" overlay={createTooltip('paste', 'Paste')}>
              <i className="material-icons">content_paste</i>
            </OverlayTrigger>
          </Button>

          <div className={style.separator} />

          <Button
            className={style.btn}
            bsStyle="default"
            active={isInsertNodeMode}
            onClick={toggleInsertMode('insert_node')}
          >
            <OverlayTrigger placement="bottom" overlay={createTooltip('addNode', 'Insert New Node')}>
              <i className="material-icons">add_box</i>
            </OverlayTrigger>
          </Button>

          <Button
            className={style.btn}
            bsStyle="default"
            active={isInsertSubflowMode}
            onClick={toggleInsertMode('insert_subflow')}
          >
            <OverlayTrigger placement="bottom" overlay={createTooltip('subflow', 'Insert Subflow')}>
              <i className="material-icons">link</i>
            </OverlayTrigger>
          </Button>
        </div>
      </div>
    )
  }
}

const mapDispatchToProps = dispatch => bindActionCreators({ updateGlobalStyle }, dispatch)

export default connect(null, mapDispatchToProps)(Toolbar)
