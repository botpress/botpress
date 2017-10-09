import React, { Component } from 'react'
import classnames from 'classnames'
import axios from 'axios'
import _ from 'lodash'

import actions from '~/actions'

import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap'

const style = require('./toolbar.scss')

export default class Toolbar extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {
    actions.setGlobalStyle({
      'bp-navbar': {
        borderBottom: 'none'
      }
    })
  }

  componentWillUnmount() {
    actions.setGlobalStyle({
      'bp-navbar': {}
    })
  }

  render() {
    const createTooltip = (name, text) => <Tooltip id={name}>{text}</Tooltip>

    const hasUnsavedChanges = false

    return (
      <div className={style.wrapper}>
        <div className={style.toolbar}>
          <Button className={style.btn} bsStyle="default">
            <OverlayTrigger placement="bottom" overlay={createTooltip('addFlow', 'Create new flow')}>
              <i className="material-icons">create_new_folder</i>
            </OverlayTrigger>
          </Button>

          <Button className={style.btn} bsStyle="default">
            <OverlayTrigger placement="bottom" overlay={createTooltip('search', 'Search flows')}>
              <i className="material-icons">search</i>
            </OverlayTrigger>
          </Button>

          <div className={style.separator} />

          <Button className={style.btn} bsStyle="default" disabled={!hasUnsavedChanges}>
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

          <Button className={style.btn} bsStyle="default">
            <OverlayTrigger placement="bottom" overlay={createTooltip('addNode', 'Insert New Node')}>
              <i className="material-icons">add_box</i>
            </OverlayTrigger>
          </Button>

          <Button className={style.btn} bsStyle="default">
            <OverlayTrigger placement="bottom" overlay={createTooltip('subflow', 'Insert Subflow')}>
              <i className="material-icons">link</i>
            </OverlayTrigger>
          </Button>
        </div>
      </div>
    )
  }
}
