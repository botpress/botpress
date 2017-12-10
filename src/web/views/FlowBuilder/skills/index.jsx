import React from 'react'
import { Modal, Button, Alert } from 'react-bootstrap'
import classnames from 'classnames'

export default class SkillsBuilder extends React.Component {
  render() {
    const show = this.props.opened
    const onCancel = () => this.props.cancelNewSkill()
    const onHide = onCancel

    // Size of modal
    // __

    const onSubmit = () => false
    const canSubmit = true

    console.log('---->', this.props)

    return (
      <Modal animation={false} show={show} onHide={onHide} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Insert a new skill | ...todo...</Modal.Title>
        </Modal.Header>
        <Modal.Body>Hello, there we should inject the component's view</Modal.Body>
        <Modal.Footer>
          <Button onClick={onCancel}>Cancel</Button>
          <Button onClick={onSubmit} bsStyle="primary">
            Insert
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
}
