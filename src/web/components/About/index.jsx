import React from 'react'
import {
  Modal,
  Button,
  Alert
} from 'react-bootstrap'

import axios from 'axios'
import _ from 'lodash'

import actions from '~/actions'

import style from './style.scss'

export default class AboutComponent extends React.Component {

  constructor(props) {
    super(props)

    this.handleClose = this.handleClose.bind(this)
  }

  handleClose() {
    actions.toggleAboutModal()
  }

  render() {
    return (
      <Modal show={this.props.opened} onHide={this.handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>About Botpress</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h3>Botpress <b>v{window.BOTPRESS_VERSION}</b></h3>
          <h5>The only sane way of building great bots</h5>
          <br />
          Emoji provided free by <a href="http://emojione.com/">EmojiOne</a>
        </Modal.Body>
      </Modal>
    )
  }
}
