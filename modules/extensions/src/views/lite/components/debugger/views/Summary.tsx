import sdk from 'botpress/sdk'
import React from 'react'

import Dialog from './Dialog'
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
      return <div>Cannot display event summary</div>
    }

    return (
      <div>
        <Dialog
          suggestions={this.props.event.suggestions}
          decision={this.props.event.decision}
          stacktrace={this.props.event.state.__stacktrace}
        />
        <NLU session={this.props.event.state.session} nluData={this.props.event.nlu} />
      </div>
    )
  }
}
