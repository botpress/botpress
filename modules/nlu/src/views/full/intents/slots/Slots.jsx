import React, { Fragment } from 'react'
import _ from 'lodash'

import SlotModal from './SlotModal'

import style from './style.scss'
import ActionSlotItem from './ActionSlotItem'
import SlotItem from './SlotItem'
import { NonIdealState, Button } from '@blueprintjs/core'

export default class Slots extends React.Component {
  state = {
    selectedText: null,
    selectedSlot: null,
    slotModalVisible: false,
    selectedSlotIndex: null
  }

  intentEditor = null

  componentDidMount() {
    this.initiateStateFromProps(this.props)
  }

  componentDidUpdate(prevprops) {
    if (prevprops.slots !== this.props.slots) {
      this.initiateStateFromProps()
    }
  }

  initiateStateFromProps = () => {
    const slots = this.getSlots()
    if (slots.length > 0) {
      this.setState({
        selectedSlot: slots[0],
        selectedSlotIndex: 0
      })
    }
  }

  // this should be passed as props from intent editor (index.js)
  tagSelectedText = slot => {
    if (!slot) {
      slot = this.state.selectedSlot
    }
    this.intentEditor.tagSelected(slot)
    this.setState({ selectedText: null })
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

  showSlotModal = (slot, index) => {
    this.setState({
      slotModalVisible: true,
      selectedSlot: slot,
      selectedSlotIndex: index
    })
  }

  // This function is used by some other components, bad smell + be careful if you edit
  setSelection = (selectedText, intentEditor) => {
    this.intentEditor = intentEditor

    this.setState({ selectedText })
  }

  getSlots = () => {
    return this.props.slots || []
  }

  updateSelectedSlot = (slot, index) => {
    this.setState({
      selectedSlot: slot,
      selectedSlotIndex: index
    })
  }

  changeSelectedSlot = step => {
    const slots = this.getSlots()

    let selectedSlotIndex = this.state.selectedSlotIndex + step
    if (selectedSlotIndex >= slots.length) {
      selectedSlotIndex = 0
    } else if (selectedSlotIndex < 0) {
      selectedSlotIndex = slots.length - 1
    }

    this.updateSelectedSlot(slots[selectedSlotIndex], selectedSlotIndex)
  }

  moveUp() {
    this.changeSelectedSlot(-1)
  }

  moveDown() {
    this.changeSelectedSlot(1)
  }

  onSlotSave = (slot, operation) => {
    let slots = [...this.getSlots()]
    let index = this.state.selectedSlotIndex
    if (operation === 'modified') {
      slots = [...slots.slice(0, this.state.selectedSlotIndex), slot, ...slots.slice(this.state.selectedSlotIndex + 1)]
    } else {
      index = slots.length
      slots = [...slots, slot]
    }

    this.updateSelectedSlot(slot, index)
    const oldname = this.selectedSlot ? this.selectedSlot.name : ''
    this.props.onSlotsChanged && this.props.onSlotsChanged(slots, { operation, oldname, name: slot.name })
  }

  onSlotDeleted = slot => {
    const slots = [...this.getSlots().filter(s => s.id !== slot.id)]
    this.props.onSlotsChanged && this.props.onSlotsChanged(slots, { operation: 'deleted', name: slot.name })
    this.updateSelectedSlot(slots.length ? slots[0] : null, slots.length ? 0 : null)
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
          this.tagSelectedText()
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
              return (
                <ActionSlotItem
                  key={slot.id}
                  slot={slot}
                  active={slot.id === this.state.selectedSlot.id}
                  onClick={this.tagSelectedText.bind(this, slot)}
                />
              )
            } else {
              return (
                <SlotItem
                  key={slot.id}
                  slot={slot}
                  onDelete={this.onSlotDeleted}
                  onEdit={this.showSlotModal.bind(this, slot, i)}
                />
              )
            }
          })}
        </ul>

        <Button icon="add" large onClick={this.showSlotModal.bind(this, null, null)}>
          Create a slot
        </Button>
      </div>
    )
  }

  renderWithoutSlots = () => {
    if (this.hasSelectedText()) {
      this.recommendedAction = () => {
        this.showSlotModal(null, null)
        return 'create-entity'
      }
    }

    return (
      <div className={style.centerContainer}>
        <NonIdealState
          icon="layers"
          description="No slots defined for this intent"
          action={
            <Button icon="add" large onClick={this.showSlotModal.bind(this, null, null)}>
              Create a slot
            </Button>
          }
        />
        {this.hasSelectedText() && (
          <div className={style.buttonTip}>
            Press <strong>Enter</strong> to create a slot
          </div>
        )}
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
          slots={this.getSlots()}
        />
        {this.getSlots().length > 0 ? this.renderWithSlots() : this.renderWithoutSlots()}
      </div>
    )
  }
}
