import React from 'react'
import _ from 'lodash'

import SlotModal from './SlotModal'

import style from '../style.scss'
import SlotItem from './SlotItem'
import { NonIdealState, Button } from '@blueprintjs/core'

export default class Slots extends React.Component {
  state = {
    slotModalVisible: false,
    editingSlotIdx: null
  }

  getSlots = () => this.props.slots

  hideSlotModal = () => {
    this.setState({ slotModalVisible: false })
  }

  onSlotSave = (slot, operation) => {
    let slots = [...this.getSlots()]
    if (operation === 'modified') {
      slots = [...slots.slice(0, this.state.editingSlotIdx), slot, ...slots.slice(this.state.editingSlotIdx + 1)]
    } else {
      slots = [...slots, slot]
    }

    const oldName = this.state.editingSlotIdx !== null ? this.props.slots[this.state.editingSlotIdx].name : ''
    this.props.onSlotsChanged && this.props.onSlotsChanged(slots, { operation, oldName, name: slot.name })
  }

  onSlotDeleted = slot => {
    const slots = [...this.getSlots().filter(s => s.id !== slot.id)]
    this.props.onSlotsChanged && this.props.onSlotsChanged(slots, { operation: 'deleted', name: slot.name })
  }

  showSlotModal = idx => {
    this.setState({
      slotModalVisible: true,
      editingSlotIdx: idx
    })
  }

  renderWithSlots = () => {
    const slots = this.getSlots()

    return (
      <div className={style.slotsContainer}>
        <ul>
          {slots.map((slot, i) => (
            <SlotItem
              key={slot.id}
              slot={slot}
              onDelete={this.onSlotDeleted}
              onEdit={this.showSlotModal.bind(this, i)}
            />
          ))}
        </ul>

        <Button icon="add" large onClick={this.showSlotModal.bind(this, null)}>
          Create a slot
        </Button>
      </div>
    )
  }

  renderWithoutSlots = () => {
    return (
      <div className={style.centerContainer}>
        <NonIdealState
          icon="layers"
          description="No slots defined for this intent"
          action={
            <Button icon="add" large onClick={this.showSlotModal.bind(this, null)}>
              Create a slot
            </Button>
          }
        />
      </div>
    )
  }

  render() {
    return (
      <div className={style.slotSidePanel}>
        <SlotModal
          axios={this.props.axios}
          show={this.state.slotModalVisible}
          slot={this.props.slots[this.state.editingSlotIdx]}
          onSlotSave={this.onSlotSave}
          onHide={this.hideSlotModal}
          slots={this.getSlots()}
        />
        {this.getSlots().length > 0 ? this.renderWithSlots() : this.renderWithoutSlots()}
      </div>
    )
  }
}
