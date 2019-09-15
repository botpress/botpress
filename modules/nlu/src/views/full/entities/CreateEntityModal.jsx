import React from 'react'

import Select from 'react-select'
import { Modal, FormControl } from 'react-bootstrap'
import { sanitizeFilenameNoExt } from '../../../util'
import { Button, Intent } from '@blueprintjs/core'
const AVAILABLE_TYPES = [
  {
    label: 'List',
    value: 'list'
  },
  {
    label: 'Pattern',
    value: 'pattern'
  }
]

const DEFAULT_STATE = {
  name: '',
  type: AVAILABLE_TYPES[0],
  isValid: false
}

export default class CreateEntityModal extends React.Component {
  state = { ...DEFAULT_STATE }

  handleNameChange = e => {
    this.setState({ name: e.target.value })
    this.validate()
  }

  handleTypeChange = type => {
    this.setState({ type })
    this.validate()
  }

  createEntity = e => {
    const entity = {
      id: sanitizeFilenameNoExt(this.state.name),
      name: this.state.name,
      type: this.state.type.value,
      occurences: []
    }
    this.props.api.createEntity(entity).then(() => {
      this.setState({ ...DEFAULT_STATE })
      this.props.onEntityCreated(entity)
      this.props.hide()
    })
  }

  validate() {
    this.setState({ isValid: this.state.name.trim().length > 0 && this.state.type !== undefined })
  }

  render() {
    return (
      <Modal show={this.props.visible} bsSize="small" onHide={this.props.hide} animation={false} backdrop={'static'}>
        <Modal.Header closeButton>
          <Modal.Title>Create Entity</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h4>Name</h4>
          <FormControl
            tabIndex="1"
            autoFocus
            type="text"
            placeholder="Name"
            value={this.state.name}
            onChange={this.handleNameChange}
          />

          <h4>Type</h4>
          <Select
            tabIndex="2"
            name="entity-type"
            value={this.state.type}
            onChange={this.handleTypeChange}
            options={AVAILABLE_TYPES}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button tabIndex="3" intent={Intent.PRIMARY} disabled={!this.state.isValid} onClick={this.createEntity}>
            Create Entity
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
}
