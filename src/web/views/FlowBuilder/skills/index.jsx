import React from 'react'
import { Modal, Button, Alert } from 'react-bootstrap'
import classnames from 'classnames'

export default class SkillsBuilder extends React.Component {
  render() {
    const show = true
    const onHide = () => false

    const onClose = () => false
    const onSubmit = () => false

    const canSubmit = true

    return (
      <Modal animation={false} show={show} onHide={onHide}>
        <Modal.Header closeButton>
          <Modal.Title>Insert a new skill | ...todo...</Modal.Title>
        </Modal.Header>
        <Modal.Body>Hello, there we should inject the component's view</Modal.Body>
        <Modal.Footer>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={onSubmit} bsStyle="primary">
            Insert
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
}
