import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { Scenario } from './typings'
import { convertLastMessages } from './utils'

export class Builder {
  private database: any
  private _events!: sdk.IO.StoredEvent[]
  private _eventIds: string[]
  private _scenario?: Scenario

  constructor(database: any, eventIds: string[]) {
    this.database = database
    this._eventIds = eventIds

    this._scenario = {
      initialState: undefined,
      finalState: undefined,
      steps: []
    }
  }

  async createScenario() {
    this._events = await this._loadEvents()

    if (this._events.length !== this._eventIds.length) {
      throw new Error(
        `Could not load some events. Expected ${this._eventIds.length}, got ${this._events.length} events`
      )
    }

    this._setInitialState()
    this._buildSteps()
    this._setFinalState()

    return _.omit(this._scenario, [
      'initialState.session.lastMessages',
      'initialState.context.jumpPoints',
      'initialState.context.queue',
      'finalState.session.lastMessages',
      'finalState.context.jumpPoints',
      'finalState.context.queue'
    ])
  }

  private _setInitialState() {
    const event = this._getIncoming(_.first(this._eventIds))
    if (event) {
      this._scenario.initialState = event.state
    }
  }

  private _setFinalState() {
    const event = this._getIncoming(_.last(this._eventIds))
    if (event) {
      this._scenario.finalState = event.state
    }
  }

  private _buildSteps() {
    for (const incomingEventId of this._eventIds) {
      const incoming = this._getIncoming(incomingEventId)

      const interactions = convertLastMessages(incoming.state.session.lastMessages, incomingEventId)
      if (interactions) {
        this._scenario.steps.push(interactions)
      }
    }
  }

  private _getIncoming = (eventId): sdk.IO.IncomingEvent => {
    const storedEvent = this._events.find(evt => evt.incomingEventId === eventId && evt.direction === 'incoming')
    return storedEvent && (storedEvent.event as sdk.IO.IncomingEvent)
  }

  private async _loadEvents() {
    return this.database('events')
      .whereIn('incomingEventId', this._eventIds)
      .andWhere({ direction: 'incoming' })
      .then(rows =>
        rows.map(storedEvent => ({
          ...storedEvent,
          event: this.database.json.get(storedEvent.event)
        }))
      )
  }
}
