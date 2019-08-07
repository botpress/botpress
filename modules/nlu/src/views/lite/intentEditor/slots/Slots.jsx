import React from 'react'
import _ from 'lodash'

import SlotModal from './SlotModal'

import style from './style.scss'
import SlotItem from './SlotItem'
import { NonIdealState, Button } from '@blueprintjs/core'

export default class Slots extends React.Component {
  state = {
    slotModalVisible: false,
    selectedSlot: null
  }

  getSlots = () => this.props.slots

  updateSelectedSlot = selectedSlot => {
    this.setState({ selectedSlot })
  }

  hideSlotModal = () => {
    this.setState({ slotModalVisible: false })
  }

  onSlotSave = (slot, operation) => {
    let slots = [...this.getSlots()]
    if (operation === 'modified') {
      slots = [...slots.slice(0, this.state.selectedSlotIndex), slot, ...slots.slice(this.state.selectedSlotIndex + 1)]
    } else {
      slots = [...slots, slot]
    }

    const oldname = this.state.selectedSlot ? this.state.selectedSlot.name : ''
    this.props.onSlotsChanged && this.props.onSlotsChanged(slots, { operation, oldname, name: slot.name })

    this.updateSelectedSlot(slot)
  }

  onSlotDeleted = slot => {
    const slots = [...this.getSlots().filter(s => s.id !== slot.id)]
    this.props.onSlotsChanged && this.props.onSlotsChanged(slots, { operation: 'deleted', name: slot.name })
  }

  showSlotModal = slot => {
    this.setState({
      slotModalVisible: true,
      selectedSlot: slot
    })
  }

  renderWithSlots = () => {
    const slots = this.getSlots()

    return (
      <div className={style.normalContainer}>
        <ul>
          {slots.map((slot, i) => (
            <SlotItem
              key={slot.id}
              slot={slot}
              onDelete={this.onSlotDeleted}
              onEdit={this.showSlotModal.bind(this, slot)}
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
          slot={this.state.selectedSlot}
          onSlotSave={this.onSlotSave}
          onHide={this.hideSlotModal}
          slots={this.getSlots()}
        />
        {this.getSlots().length > 0 ? this.renderWithSlots() : this.renderWithoutSlots()}
      </div>
    )
  }
}
