import { Button, H5 } from '@blueprintjs/core'
import React from 'react'

import style from '../style.scss'

export class Flow extends React.Component<any, State> {
  state = {
    history: [],
    historyPosition: 0
  }

  componentDidMount() {
    this.setState({ history: this.props.history, historyPosition: -1 })
  }

  componentDidUpdate(prevProps) {
    if (prevProps.history !== this.props.history) {
      this.setState({ history: this.props.history, historyPosition: -1 })
    }
  }

  showNode = isUp => {
    const { history, historyPosition } = this.state
    try {
      let newIndex = isUp ? historyPosition + 1 : historyPosition - 1
      if (newIndex < 0) {
        newIndex = history.length - 1
      } else if (newIndex >= history.length) {
        newIndex = 0
      }

      const current = history[newIndex]

      if (current) {
        // @ts-ignore
        window.parent.highlightNode(current.flow, current.node)
        this.setState({ historyPosition: newIndex })
      }
    } catch (err) {
      console.log(err)
    }
  }

  render() {
    return (
      <div className={style.block}>
        <H5>Flow Nodes History</H5>
        <p>
          This feature allows you to see by which nodes the user traveled to get those answers. It is still experimental
          and subject to change{' '}
        </p>
        <Button onClick={() => this.showNode(false)} disabled={this.state.historyPosition <= 0}>
          Previous
        </Button>{' '}
        <Button
          onClick={() => this.showNode(true)}
          disabled={this.state.historyPosition + 1 === this.state.history.length}
        >
          {this.state.historyPosition === -1 ? 'First node' : 'Next'}
        </Button>
        <ol>
          {this.state.history.map((entry, idx) => {
            const flowName = entry.flow && entry.flow.replace('.flow.json', '')
            return (
              <li key={idx}>
                {this.state.historyPosition === idx ? (
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
  history: any
  historyPosition: number
}
