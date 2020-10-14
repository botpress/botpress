import React from 'react'
import { BaseWidget, BaseWidgetProps, NodeModel } from 'storm-react-diagrams'

export interface PortProps extends BaseWidgetProps {
  name: string
  node: NodeModel
  simplePortClick?: (e: React.MouseEvent) => void
}

export interface PortState {
  selected: boolean
  startMouse: { x: number; y: number }
}

export class PortWidget extends BaseWidget<PortProps, PortState> {
  constructor(props: PortProps) {
    super('srd-port', props)
    this.state = {
      selected: false,
      startMouse: { x: 0, y: 0 }
    }
  }

  getClassName() {
    return 'port ' + super.getClassName() + (this.state.selected ? this.bem('--selected') : '')
  }

  render() {
    return (
      <div
        {...this.getProps()}
        onMouseEnter={() => {
          this.setState({ selected: true })
        }}
        onMouseLeave={() => {
          this.setState({ selected: false })
        }}
        onClick={e => {
          if (e.screenX - this.state.startMouse.x === 0 && e.screenY - this.state.startMouse.y == 0) {
            e.persist()
            this.props.simplePortClick?.(e)
          }
        }}
        onMouseDown={e => this.setState({ startMouse: { x: e.screenX, y: e.screenY } })}
        data-name={this.props.name}
        data-nodeid={this.props.node.getID()}
      />
    )
  }
}
