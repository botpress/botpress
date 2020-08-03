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

const DEBUGGER_STATE_KEY = `debuggerState`

const getDebuggerState = () => {
  try {
    return JSON.parse(window['BP_STORAGE'].get(DEBUGGER_STATE_KEY) || '{}')
  } catch (error) {
    return {}
  }
}

export default class Summary extends React.Component<Props> {
  state = {
    hasError: false,
    expandedSections: [],
    jsonSections: []
  }

  componentDidMount() {
    const { expandedSections, jsonSections } = getDebuggerState()

    this.setState({
      expandedSections: expandedSections || [],
      jsonSections: jsonSections || []
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

  handleUpdateExpandedSections(section: string, expanded: boolean): void {
    const expandedSections = this.state.expandedSections.filter(item => item !== section)

    if (expanded) {
      expandedSections.push(section)
    }

    this.updateLocalStorage({ expandedSections })
    this.setState({ expandedSections })
  }

  handleUpdateJsonSections(section: string, isJson: boolean): void {
    const jsonSections = this.state.jsonSections.filter(item => item !== section)

    if (isJson) {
      jsonSections.push(section)
    }

    this.updateLocalStorage({ jsonSections })
    this.setState({ jsonSections })
  }

  updateLocalStorage(data: { [key: string]: string[] }) {
    window['BP_STORAGE'].set(DEBUGGER_STATE_KEY, JSON.stringify({ ...getDebuggerState(), ...data }))
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
          expandedSections={this.state.expandedSections}
          updateExpandedSections={this.handleUpdateExpandedSections.bind(this)}
          jsonSections={this.state.jsonSections}
          updateJsonSections={this.handleUpdateJsonSections.bind(this)}
          session={this.props.event.state.session}
          isNDU={!!this.props.event.ndu}
          nluData={this.props.event.nlu}
        />
        <Dialog
          expandedSections={this.state.expandedSections}
          updateExpandedSections={this.handleUpdateExpandedSections.bind(this)}
          jsonSections={this.state.jsonSections}
          updateJsonSections={this.handleUpdateJsonSections.bind(this)}
          suggestions={this.props.event.suggestions}
          decision={this.props.event.decision}
          stacktrace={this.props.event.state?.__stacktrace}
        />

        <NDU
          expandedSections={this.state.expandedSections}
          updateExpandedSections={this.handleUpdateExpandedSections.bind(this)}
          jsonSections={this.state.jsonSections}
          updateJsonSections={this.handleUpdateJsonSections.bind(this)}
          ndu={this.props.event.ndu}
        />

        <Collapsible
          opened={this.state.expandedSections.includes('state')}
          updateExpandedSections={expanded => this.handleUpdateExpandedSections('state', expanded)}
          name="State"
        >
          <Inspector data={this.props.event.state} />
        </Collapsible>
        {eventError && (
          <Collapsible
            opened={this.state.expandedSections.includes('errors')}
            updateExpandedSections={expanded => this.handleUpdateExpandedSections('errors', expanded)}
            name="Errors"
          >
            <Inspector data={eventError} />
          </Collapsible>
        )}
      </div>
    )
  }
}
