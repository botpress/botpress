import React from 'react'
import Select from 'react-select'
import { Button, Modal, FormControl } from 'react-bootstrap'
import nanoid from 'nanoid'

const AVAILABLE_TYPES = [
  {
    label: 'Pattern',
    value: 'pattern'
  },
  {
    label: 'List',
    value: 'list'
  }
]

const DEFAULT_STATE = {
  name: '',
  type: undefined
}

export default class CreateEntityModal extends React.Component {
  state = { ...DEFAULT_STATE }

  handleNameChange = e => {
    this.setState({ name: e.target.value })
  }

  handleTypeChange = selected => {
    this.setState({ type: selected.value })
  }

  createEntity = () => {
    const entity = {
      id: nanoid(),
      name: this.state.name,
      type: this.state.type,
      pattern: '',
      occurences: []
    }
    this.props.axios.post(`/mod/nlu/entities/`, entity).then(() => {
      this.setState({ ...DEFAULT_STATE })
      this.props.onEntityCreated(entity)
      this.props.hide()
    })
  }

  render() {
    return (
      <Modal show={this.props.visible} bsSize="small" onHide={this.props.hide} animation={false}>
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
          <Button
            tabIndex="3"
            bsStyle="primary"
            disabled={this.state.name === undefined || this.state.type === undefined}
            onClick={this.createEntity}
          >
            Create Entity
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
}
