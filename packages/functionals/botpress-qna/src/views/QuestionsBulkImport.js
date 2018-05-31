import React, { Component } from 'react'

import { Modal, FormControl, Button } from 'react-bootstrap'

class QuestionsBulkImport extends Component {
  state = {
    value: ''
  }

  onValueChange = event => {
    this.setState({
      value: event.target.value
    })
  }

  getFilteredQuestions = () =>
    this.state.value
      .split(/\n+/)
      .map(s => s.trim())
      .filter(Boolean)

  onSave = () => {
    this.props.onSubmit(this.getFilteredQuestions())
  }

  render() {
    const { onCancel } = this.props

    const count = this.getFilteredQuestions().length

    return (
      <Modal show={true} onHide={onCancel}>
        <Modal.Header closeButton>
          <Modal.Title>Questions Bulk Import</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Paste the questions blob into the text field, each question on its own line.</p>
          <FormControl
            inputRef={input => input && input.focus()}
            rows="10"
            componentClass="textarea"
            value={this.state.value}
            onChange={this.onValueChange}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={onCancel}>Cancel</Button>
          <Button disabled={!count} bsStyle="success" onClick={this.onSave}>
            Import {count} question{count === 1 ? '' : 's'}
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
}

export default QuestionsBulkImport
