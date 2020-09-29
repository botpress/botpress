import sdk from 'botpress/sdk'
import _ from 'lodash'
import React from 'react'

import Collapsible from '../../../../../../../../src/bp/ui-shared-lite/Collapsible'
import ContentSection from '../../../../../../../../src/bp/ui-shared-lite/ContentSection'
import lang from '../../../../lang'
import style from '../style.scss'

import { Inspector } from './Inspector'
import NDU from './NDU'
import NLU from './NLU'
import State from './State'

interface Props {
  event: sdk.IO.IncomingEvent
  prevEvent: sdk.IO.IncomingEvent
}

const DEBUGGER_STATE_KEY = 'debuggerState'
const ERROR_PANEL = 'panel::errors'

const getDebuggerState = () => {
  try {
    return JSON.parse(window['BP_STORAGE'].get(DEBUGGER_STATE_KEY) || '[]')
  } catch (error) {
    return []
  }
}

export default class Summary extends React.Component<Props> {
  state = {
    hasError: false,
    toggledSection: []
  }

  componentDidMount() {
    const toggledSection = getDebuggerState()

    this.setState({
      toggledSection
    })
  }

  componentDidUpdate(prevProps) {
    if (prevProps.event !== this.props.event) {
      this.setState({ hasError: false })
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  toggleExpand(section: string, expanded: boolean): void {
    const toggledSection = this.state.toggledSection.filter(item => item !== section)

    if (expanded) {
      toggledSection.push(section)
    }

    window['BP_STORAGE'].set(DEBUGGER_STATE_KEY, JSON.stringify(toggledSection))
    this.setState({ toggledSection })
  }

  isExpanded(key) {
    return this.state.toggledSection.includes(key)
  }

  render() {
    const eventError = _.get(this.props, 'event.state.__error')

    if (this.state.hasError) {
      return <ContentSection title={lang.tr('module.extensions.summary.cannotDisplay')} />
    }

    return (
      <div>
        <NLU
          isExpanded={this.isExpanded.bind(this)}
          toggleExpand={this.toggleExpand.bind(this)}
          session={this.props.event.state.session}
          context={this.props.event.state.context}
          isNDU={!!this.props.event.ndu}
          nluData={this.props.event.nlu}
        />
        <NDU
          isExpanded={this.isExpanded.bind(this)}
          toggleExpand={this.toggleExpand.bind(this)}
          ndu={this.props.event.ndu}
        />

        <State
          isExpanded={this.isExpanded.bind(this)}
          toggleExpand={this.toggleExpand.bind(this)}
          state={this.props.event.state}
          prevState={this.props.prevEvent?.state}
        />

        {eventError && (
          <Collapsible
            opened={this.isExpanded(ERROR_PANEL)}
            toggleExpand={expanded => this.toggleExpand(ERROR_PANEL, expanded)}
            name={lang.tr('module.extensions.summary.errors')}
          >
            <Inspector data={eventError} />
          </Collapsible>
        )}
      </div>
    )
  }
}
