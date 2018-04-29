import React, { Component } from 'react'
import { DefaultLinkWidget, LinkFactory, PointModel } from 'storm-react-diagrams'

class DeletableLinkWidget extends DefaultLinkWidget {
  addPointToLink = (event, index) => {
    if (
      event.type === 'contextmenu' &&
      !this.props.diagramEngine.isModelLocked(this.props.link) &&
      this.props.link.points.length - 1 <= this.props.diagramEngine.getMaxNumberPointsPerLink()
    ) {
      event.preventDefault()
      const point = new PointModel(this.props.link, this.props.diagramEngine.getRelativeMousePoint(event))
      point.setSelected(true)
      this.forceUpdate()
      this.props.link.addPoint(point, index)
      this.props.pointAdded(point, event)
    }
  }

  generateLink(extraProps, id) {
    const { link, width, color, diagramEngine } = this.props
    const index = extraProps['data-point'] || 0

    const Bottom = (
      <path
        className={this.state.selected || link.isSelected() ? 'selected' : ''}
        strokeWidth={width}
        stroke={color}
        ref={path => path && this.refPaths && this.refPaths.push(path)}
        {...extraProps}
      />
    )

    const Top = (
      <path
        strokeLinecap="round"
        onMouseLeave={() => this.setState({ selected: false })}
        onMouseEnter={() => this.setState({ selected: true })}
        data-linkid={link.getID()}
        stroke={color}
        strokeOpacity={this.state.selected ? 0.1 : 0}
        strokeWidth={20}
        onContextMenu={event => this.addPointToLink(event, index + 1)}
        {...extraProps}
      />
    )

    return (
      <g key={'link-' + id}>
        {Bottom}
        {Top}
      </g>
    )
  }
}

export class DeletableLinkFactory extends LinkFactory {
  constructor() {
    super('default')
  }

  generateReactWidget(diagramEngine, link) {
    return React.createElement(DeletableLinkWidget, { link, diagramEngine })
  }
}
