import { Button, H5 } from '@blueprintjs/core'
import React from 'react'

import style from '../style.scss'

export class Flow extends React.Component<any, State> {
  state = {
    stacktrace: [],
    stacktraceOffset: 0
  }

  componentDidMount() {
    this.setState({ stacktrace: this.props.stacktrace, stacktraceOffset: -1 })
  }

  componentDidUpdate(prevProps) {
    if (prevProps.stacktrace !== this.props.stacktrace) {
      this.setState({ stacktrace: this.props.stacktrace, stacktraceOffset: -1 })
      this.highlightNode()
    }
  }

  highlightNode(flow?: string, node?: string) {
    // @ts-ignore
    window.parent && window.parent.highlightNode && window.parent.highlightNode(flow, node)
  }

  moveStacktrace = moveForward => {
    const { stacktrace, stacktraceOffset } = this.state
    try {
      let newIndex = moveForward ? stacktraceOffset + 1 : stacktraceOffset - 1
      if (newIndex < 0) {
        newIndex = stacktrace.length - 1
      } else if (newIndex >= stacktrace.length) {
        newIndex = 0
      }

      const current = stacktrace[newIndex]

      if (current) {
        this.highlightNode(current.flow, current.node)
        this.setState({ stacktraceOffset: newIndex })
      }
    } catch (err) {
      console.error('Error while tring to show node', err)
    }
  }

  render() {
    return (
      <div className={style.block}>
        <H5>Flow Nodes History</H5>
        <p>
          This feature allows you to see by which nodes the user traveled to get those answers. It is still experimental
          and subject to change
        </p>
        <Button onClick={() => this.moveStacktrace(false)} disabled={this.state.stacktraceOffset <= 0}>
          Previous
        </Button>
        <Button
          onClick={() => this.moveStacktrace(true)}
          disabled={this.state.stacktraceOffset + 1 === this.state.stacktrace.length}
        >
          Next
        </Button>
        <ol>
          {this.state.stacktrace.map((entry, idx) => {
            const flowName = entry.flow && entry.flow.replace('.flow.json', '')
            return (
              <li key={idx}>
                {this.state.stacktraceOffset === idx ? (
                  <strong>
                    {flowName} / {entry.node}
                  </strong>
                ) : (
                  <span>
                    {flowName} / {entry.node}
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </div>
    )
  }
}

interface State {
  stacktrace: any
  stacktraceOffset: number
}
