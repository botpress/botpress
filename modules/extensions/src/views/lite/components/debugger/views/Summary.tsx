import sdk from 'botpress/sdk'
import _ from 'lodash'
import React from 'react'

import { Collapsible } from '../components/Collapsible'
import style from '../style.scss'

import Dialog from './Dialog'
import { Inspector } from './Inspector'
import NDU from './NDU'
import NLU from './NLU'

interface Props {
  event: sdk.IO.IncomingEvent
}

export default class Summary extends React.Component<Props> {
  state = {
    hasError: false
  }

  componentDidUpdate(prevProps) {
    if (prevProps.event !== this.props.event) {
      this.setState({ hasError: false })
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  render() {
    const eventError = _.get(this.props, 'event.state.__error')

    if (this.state.hasError) {
      return (
        <div className={style.section}>
          <p>Cannot display event summary</p>
        </div>
      )
    }

    return (
      <div>
        <NLU session={this.props.event.state.session} nluData={this.props.event.nlu} />
        <Dialog
          suggestions={this.props.event.suggestions}
          decision={this.props.event.decision}
          stacktrace={this.props.event.state?.__stacktrace}
        />

        <NDU ndu={this.props.event.ndu} />

        <Collapsible name="State">
          <Inspector data={this.props.event.state} />
        </Collapsible>
        {eventError && (
          <Collapsible name="Errors">
            <Inspector data={eventError} />
          </Collapsible>
        )}
      </div>
    )
  }
}
