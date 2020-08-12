import sdk from 'botpress/sdk'
import _ from 'lodash'
import React from 'react'

import { Collapsible } from '../components/Collapsible'
import style from '../style.scss'

import { Inspector } from './Inspector'
import NDU from './NDU'
import NLU from './NLU'

interface Props {
  event: sdk.IO.IncomingEvent
}

const DEBUGGER_STATE_KEY = 'debuggerState'
const ERROR_PANEL = 'panel::errors'
const STATE_PANEL = 'panel::state'

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
      return (
        <div className={style.section}>
          <p>Cannot display event summary</p>
        </div>
      )
    }

    return (
      <div>
        <NLU
          isExpanded={this.isExpanded.bind(this)}
          toggleExpand={this.toggleExpand.bind(this)}
          session={this.props.event.state.session}
          isNDU={!!this.props.event.ndu}
          nluData={this.props.event.nlu}
        />
        <NDU
          isExpanded={this.isExpanded.bind(this)}
          toggleExpand={this.toggleExpand.bind(this)}
          ndu={this.props.event.ndu}
        />

        <Collapsible
          opened={this.isExpanded(STATE_PANEL)}
          toggleExpand={expanded => this.toggleExpand(STATE_PANEL, expanded)}
          name="State"
        >
          <Inspector data={this.props.event.state} />
        </Collapsible>
        {eventError && (
          <Collapsible
            opened={this.isExpanded(ERROR_PANEL)}
            toggleExpand={expanded => this.toggleExpand(ERROR_PANEL, expanded)}
            name="Errors"
          >
            <Inspector data={eventError} />
          </Collapsible>
        )}
      </div>
    )
  }
}
