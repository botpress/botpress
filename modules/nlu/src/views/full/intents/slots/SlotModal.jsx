import React from 'react'
import Select from 'react-select'
import { Button, Modal } from 'react-bootstrap'
import nanoid from 'nanoid'
import random from 'lodash/random'

import style from './style.scss'

const N_COLORS = 12
const INITIAL_STATE = {
  id: null,
  name: '',
  entities: [],
  availableEntities: [],
  editing: false,
  color: false
}

export default class SlotModal extends React.Component {
  state = { ...INITIAL_STATE }

  fetchAvailableEntities = () => {
    return this.props.axios.get(`/mod/nlu/entities`).then(res => {
      const availableEntities = res.data.map(e => ({
        label: `@${e.type}.${e.name}`,
        value: e.name
      }))

      this.setState({ availableEntities })
    })
  }

  onNameChange = event => {
    this.setState({ name: event.target.value.replace(/[^A-Z0-9_-]/gi, '_') })
  }

  onEntitiesChanged = entities => {
    this.setState({ entities })
  }

  componentDidMount() {
    this.fetchAvailableEntities()
    this.initializeFromProps()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.slot !== this.props.slot) {
      this.initializeFromProps()
    }
  }

  initializeFromProps = () => {
    if (this.props.slot) {
      let slot = { ...this.props.slot }
      slot.entities = slot.entities.map(e => ({
        label: e,
        value: e
      }))
      this.setState({ ...slot, editing: true })
    } else this.resetState()
  }

  resetState = () => this.setState({ ...INITIAL_STATE, availableEntities: this.state.availableEntities })

  getNextAvailableColor = () => {
    const maxColor = _.get(_.maxBy(this.props.slots, 'color'), 'color') || 0

    //if no more colors available, we return a random color
    return maxColor <= N_COLORS ? maxColor + 1 : random(1, N_COLORS)
  }

  onSave = e => {
    e.preventDefault()

    const operation = this.state.editing ? 'modified' : 'created'
    const slot = {
      id: this.state.id || nanoid(),
      name: this.state.name,
      entities: this.state.entities.map(e => e.value),
      color: this.state.color || this.getNextAvailableColor()
    }

    this.props.onSlotSave && this.props.onSlotSave(slot, operation)
    this.closeModal()
  }

  closeModal = () => {
    this.resetState()
    this.props.onHide()
  }

  render() {
    const isValid = this.state.name && this.state.name.length && this.state.entities && this.state.entities.length

    return (
      <Modal show={this.props.show} onHide={this.props.onHide} animation={false} backdrop={'static'}>
        <Modal.Header closeButton>
          {this.state.editing && <Modal.Title>Edit slot</Modal.Title>}
          {!this.state.editing && <Modal.Title>Create Slot for your intent</Modal.Title>}
        </Modal.Header>
        <Modal.Body>
          <h4>Slot Name</h4>
          <input
            tabIndex="1"
            autoFocus
            className={style.entityNameInput}
            value={this.state.name}
            placeholder="Type a name here"
            onChange={this.onNameChange}
          />
          <h4>Associated Entities</h4>
          <Select
            isMulti
            tabIndex="2"
            name="entity-type"
            value={this.state.entities}
            onChange={this.onEntitiesChanged}
            options={this.state.availableEntities}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button tabIndex="3" bsStyle="primary" disabled={!isValid} onClick={this.onSave}>
            {this.state.editing && 'Save slot'}
            {!this.state.editing && 'Create slot'}
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
}
