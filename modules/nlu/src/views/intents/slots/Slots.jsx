import React, { Fragment } from 'react'
import { Button } from 'react-bootstrap'
import _ from 'lodash'

import SlotModal from './SlotModal'

import style from './style.scss'
import ActionSlotItem from './ActionSlotItem'
import SlotItem from './SlotItem'

export default class Slots extends React.Component {
  state = {
    selectedText: null,
    selectedSlot: null,
    slotModalVisible: false,
    selectedSlotIndex: 0
  }

  intentEditor = null

  tagSelectedText = entityId => {
    this.intentEditor.tagSelected(entityId)
    this.setState({ selectedText: null, selectedSlot: null })
  }

  executeRecommendedAction = intentEditor => {
    this.intentEditor = intentEditor

    if (this.recommendedAction) {
      const action = this.recommendedAction
      this.recommendedAction = null
      return action()
    }

    return null
  }

  hideSlotModal = () => {
    this.setState({
      slotModalVisible: false
    })
  }

  showSlotModal = slot => {
    this.setState({
      slotModalVisible: true,
      selectedSlot: slot,
      editingEntity: !!slot
    })
  }

  setSelection = (selectedText, selectedSlot, intentEditor) => {
    this.intentEditor = intentEditor

    let selectedSlotIndex = 0

    if (selectedSlot) {
      selectedSlotIndex = _.findIndex(this.getSlots(), { id: selectedSlot })
    }

    this.setState({ selectedText, selectedSlot, selectedSlotIndex: selectedSlotIndex })
  }

  getSlots = () => {
    return this.props.slots || []
  }

  moveUp() {
    if (this.state.selectedSlotIndex === 0) {
      this.setState({
        selectedSlotIndex: this.getSlots().length - 1
      })
    } else {
      this.setState({
        selectedSlotIndex: Math.max(this.state.selectedSlotIndex - 1, 0)
      })
    }
  }

  moveDown() {
    if (this.state.selectedSlotIndex === this.getSlots().length - 1) {
      this.setState({
        selectedSlotIndex: 0
      })
    } else {
      this.setState({
        selectedSlotIndex: Math.min(this.state.selectedSlotIndex + 1, this.getSlots().length - 1)
      })
    }
  }

  onSlotSave = (slot, operation) => {
    debugger
    let slots = [...this.getSlots()]
    if (operation === 'modified') {
      slots = [...slots.slice(0, this.state.selectedSlotIndex), slot, ...slots.slice(this.state.selectedSlotIndex + 1)]
    } else {
      slots = [...slots, slot]
    }

    const oldname = this.selectedSlot ? this.selectedSlot.name : ''
    this.props.onSlotsChanged && this.props.onSlotsChanged(slots, { operation, oldname, name: slot.name })
  }

  onSlotDeleted = slot => {
    const slots = [...this.getSlots().filter(s => s.id !== slot.id)]
    this.props.onSlotsChanged && this.props.onSlotsChanged(slots, { operation: 'deleted', name: slot.name })
  }

  hasSelectedText = () => {
    return this.state.selectedText && this.state.selectedText.length
  }

  // TODO on component will update, ==> update recommended action

  renderWithSlots = () => {
    const slots = this.getSlots()

    if (this.hasSelectedText()) {
      if (this.state.selectedText && this.state.selectedText.length) {
        this.recommendedAction = () => {
          const slot = slots[this.state.selectEntityIndex]
          this.tagSelectedText(slot.id)
          return 'create-entity'
        }
      }
    }

    return (
      <div className={style.normalContainer}>
        {this.hasSelectedText() && (
          <Fragment>
            <h4>
              Tagging selected text <span className={style.selectionText}>"{this.state.selectedText}"</span>
            </h4>
            <hr />
          </Fragment>
        )}
        <ul>
          {slots.map((slot, i) => {
            if (this.hasSelectedText()) {
              return <ActionSlotItem key={slot.id} slot={slot} active={slot === this.selectedSlot} />
            } else {
              return (
                <SlotItem
                  key={slot.id}
                  slot={slot}
                  onDelete={this.onSlotDeleted}
                  onEdit={this.showSlotModal.bind(this, slot)}
                />
              )
            }
          })}
        </ul>
        <Button bsStyle="success" onClick={this.showSlotModal.bind(this, null)}>
          Create new slot
        </Button>
      </div>
    )
  }

  renderWithoutSlots = () => {
    if (this.hasSelectedText()) {
      this.recommendedAction = () => {
        this.showSlotModal()
        return 'create-entity'
      }
    }

    return (
      <div className={style.centerContainer}>
        <div className={style.centerElement}>
          <h1>No slot is defined for this intent 🤖</h1>
          {this.hasSelectedText() && (
            <h3>
              Define a new slot in order to tag <span className={style.selectionText}>"{this.state.selectedText}"</span>
            </h3>
          )}
          <Button bsSize="large" bsStyle="success" onClick={this.showSlotModal.bind(this, null)}>
            Create a slot
          </Button>
          {this.hasSelectedText() && (
            <div className={style.buttonTip}>
              Press <strong>Enter</strong> while editing
            </div>
          )}
        </div>
      </div>
    )
  }

  render() {
    return (
      <div>
        <SlotModal
          axios={this.props.axios}
          show={this.state.slotModalVisible}
          slot={this.state.selectedSlot}
          onSlotSave={this.onSlotSave}
          onHide={this.hideSlotModal}
        />
        {this.getSlots().length > 0 && this.renderWithSlots()}
        {this.getSlots().length === 0 && this.renderWithoutSlots()}
      </div>
    )
  }
}
