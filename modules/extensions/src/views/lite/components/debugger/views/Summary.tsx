import sdk from 'botpress/sdk'
import React from 'react'

import style from '../style.scss'

import Dialog from './Dialog'
import NDUSection from './NDUSection'
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
    if (this.state.hasError) {
      return (
        <div className={style.section}>
          <p>Cannot display event summary</p>
        </div>
      )
    }

    return (
      <div>
        <NLU session={this.props.event.state.session} isNDU={!!this.props.event.ndu} nluData={this.props.event.nlu} />
        <Dialog
          suggestions={this.props.event.suggestions}
          decision={this.props.event.decision}
          stacktrace={this.props.event.state?.__stacktrace}
        />

        <NDUSection nduData={this.props.event.ndu} />
      </div>
    )
  }
}
