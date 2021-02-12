import { Button, NonIdealState } from '@blueprintjs/core'
import { AxiosInstance } from 'axios'
import { NLU } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import _ from 'lodash'
import React from 'react'

import { NLUApi } from '../../../../api'
import style from '../style.scss'

import SlotItem from './SlotItem'
import SlotModal from './SlotModal'
import { SlotModification } from './typings'

interface State {}

interface Props {
  api: NLUApi
  slots: NLU.SlotDefinition[]
  onSlotsChanged: (slot: NLU.SlotDefinition[], mod: SlotModification) => void
}

export default class Slots extends React.Component<Props, State> {
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

  onSlotDeleted = (slot: NLU.SlotDefinition) => {
    const slots = [...this.getSlots().filter(s => s.id !== slot.id)]
    this.props.onSlotsChanged && this.props.onSlotsChanged(slots, { operation: 'deleted', name: slot.name })
  }

  showSlotModal = (idx: number) => {
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
          {lang.tr('module.nlu.slots.new')}
        </Button>
      </div>
    )
  }

  renderWithoutSlots = () => {
    return (
      <div className={style.centerContainer}>
        <NonIdealState
          icon="layers"
          description={lang.tr('module.nlu.slots.emptyState')}
          action={
            <Button icon="add" large onClick={this.showSlotModal.bind(this, null)}>
              {lang.tr('module.nlu.slots.new')}
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
          api={this.props.api}
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
