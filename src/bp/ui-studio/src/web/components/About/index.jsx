import React from 'react'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Modal } from 'react-bootstrap'

import { toggleAboutModal } from '~/actions'

const AboutComponent = props => (
  <Modal show={props.opened} onHide={props.toggleAboutModal}>
    <Modal.Header closeButton>
      <Modal.Title>About Botpress</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <h3>
        Botpress <b>v{window.BOTPRESS_VERSION}</b>
      </h3>
      <h5>The only sane way of building great bots</h5>
      <br />
      Emoji provided free by <a href="http://emojione.com/">EmojiOne</a>
    </Modal.Body>
  </Modal>
)

const mapDispatchToProps = dispatch => bindActionCreators({ toggleAboutModal }, dispatch)

export default connect(null, mapDispatchToProps)(AboutComponent)
