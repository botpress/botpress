import { Button, Classes, Dialog, FormGroup, Intent } from '@blueprintjs/core'
import { NLU } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import _ from 'lodash'
import random from 'lodash/random'
import nanoid from 'nanoid'
import React from 'react'

import { NLUApi } from '../../../../api'

import { EntitySelector } from './EntitySelector'
import { SlotOperation } from './typings'

const N_COLORS = 12
const INITIAL_STATE: State = {
  id: null,
  name: '',
  entities: [],
  editing: false,
  color: 0
}

interface State extends NLU.SlotDefinition {
  id: null | string
  name: string
  entities: string[]
  editing: boolean
  color: number
}

interface Props {
  api: NLUApi
  slot: NLU.SlotDefinition
  slots: NLU.SlotDefinition[]
  show: boolean
  onSlotSave: (slot: NLU.SlotDefinition, operation: SlotOperation) => void
  onHide: () => void
}

export default class SlotModal extends React.Component<Props, State> {
  nameInput = null
  state = { ...INITIAL_STATE }

  onNameChange = event => {
    this.setState({ name: event.target.value.replace(/[^A-Z0-9_-]/gi, '_') })
  }

  onEntitiesChanged = entities => {
    this.setState({ entities })
  }

  componentDidMount() {
    this.initializeFromProps()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.slot !== this.props.slot) {
      this.initializeFromProps()
    }
  }

  initializeFromProps = () => {
    if (this.props.slot) {
      this.setState({ ...this.props.slot, editing: true })
    } else {
      this.resetState()
    }
  }

  resetState = () => this.setState({ ...INITIAL_STATE })

  getNextAvailableColor = () => {
    const maxColor = _.get(_.maxBy(this.props.slots, 'color'), 'color') || 0

    // if no more colors available, we return a random color
    return maxColor <= N_COLORS ? maxColor + 1 : random(1, N_COLORS)
  }

  onSave = e => {
    e.preventDefault()

    const operation = this.state.editing ? 'modified' : 'created'
    const slot = {
      id: this.state.id || nanoid(),
      name: this.state.name,
      entities: this.state.entities,
      color: this.state.color || this.getNextAvailableColor()
    }

    this.props.onSlotSave && this.props.onSlotSave(slot, operation)
    this.resetState()
    this.props.onHide()
  }

  isValid = () => this.state.name && this.state.name.length && this.state.entities && this.state.entities.length

  render() {
    return (
      <Dialog
        lazy
        title={this.state.editing ? lang.tr('module.nlu.slots.editTitle') : lang.tr('module.nlu.slots.createTitle')}
        icon="add"
        isOpen={this.props.show}
        onClose={this.props.onHide}
        onOpened={() => this.nameInput.focus()}
        transitionDuration={0}
      >
        <div className={Classes.DIALOG_BODY}>
          <FormGroup label={lang.tr('name')}>
            <input
              tabIndex={1}
              ref={el => (this.nameInput = el)}
              className={`${Classes.INPUT} ${Classes.FILL}`}
              value={this.state.name}
              placeholder={lang.tr('module.nlu.slots.namePlaceholder')}
              onChange={this.onNameChange}
            />
          </FormGroup>
          <FormGroup label={lang.tr('module.nlu.slots.entitiesLabel')}>
            <EntitySelector entities={this.state.entities} api={this.props.api} onChange={this.onEntitiesChanged} />
          </FormGroup>
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button onClick={this.onSave} tabIndex={3} intent={Intent.PRIMARY} disabled={!this.isValid()}>
              {this.state.editing ? lang.tr('module.nlu.slots.save') : lang.tr('module.nlu.slots.save')}
            </Button>
          </div>
        </div>
      </Dialog>
    )
  }
}
