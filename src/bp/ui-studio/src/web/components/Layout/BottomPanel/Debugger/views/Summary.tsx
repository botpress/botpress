import sdk from 'botpress/sdk'
import { ContentSection, lang } from 'botpress/shared'
import React, { Fragment } from 'react'

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
      return <ContentSection title={lang.tr('bottomPanel.debugger.summary.cannotDisplay')} />
    }

    if (!this.props.event) {
      return null
    }

    return (
      <div className={style.sectionContainer}>
        <Dialog
          suggestions={this.props.event.suggestions}
          decision={this.props.event.decision}
          stacktrace={this.props.event.state.__stacktrace}
        />
        <NLU session={this.props.event.state.session} nluData={this.props.event.nlu} />

        {this.props.event.ndu && (
          <Fragment>
            <Actions ndu={this.props.event.ndu} />
            <Triggers ndu={this.props.event.ndu} />
          </Fragment>
        )}
      </div>
    )
  }
}
