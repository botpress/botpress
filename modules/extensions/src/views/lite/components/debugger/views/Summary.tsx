import { H4 } from '@blueprintjs/core'
import sdk from 'botpress/sdk'
import React from 'react'

import { Collapsible } from '../components/Collapsible'
import style from '../style.scss'

import { Actions } from './Actions'
import Dialog from './Dialog'
import NLU from './NLU'
import { Triggers } from './Triggers'

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
        <NLU session={this.props.event.state.session} nluData={this.props.event.nlu} />
        <Dialog
          suggestions={this.props.event.suggestions}
          decision={this.props.event.decision}
          stacktrace={this.props.event.state.__stacktrace}
        />

        {this.props.event.ndu && (
          <div className={style.block}>
            <Collapsible name="Dialog Understanding">
              <Collapsible name="Triggers">
                <Triggers ndu={this.props.event.ndu}></Triggers>
              </Collapsible>

              <Collapsible name="Actions" opened>
                <Actions ndu={this.props.event.ndu} />
              </Collapsible>
            </Collapsible>
          </div>
        )}
      </div>
    )
  }
}
