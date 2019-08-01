import React from 'react'
import { AbstractLinkFactory, DefaultLinkModel, DefaultLinkWidget, PointModel } from 'storm-react-diagrams'

class DeletableLinkWidget extends DefaultLinkWidget {
  addPointToLink = (event, index: number): void => {
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

  generateLink(path: string, extraProps: any, id: string | number): JSX.Element {
    const { link, width, color } = this.props
    const index = extraProps['data-point'] || 0

    const Bottom = (
      <path
        className={this.state.selected || link.isSelected() ? this.bem('--path-selected') : ''}
        strokeWidth={width}
        stroke={color}
        ref={path => path && this.refPaths && this.refPaths.push(path)}
        d={path}
        {...extraProps}
      />
    )

    const Top = (
      <path
        strokeLinecap="round"
        onMouseLeave={() => this.setState({ selected: false })}
        onMouseEnter={() => this.setState({ selected: true })}
        onContextMenu={event => this.addPointToLink(event, index + 1)}
        data-linkid={link.getID()}
        stroke={color}
        strokeOpacity={this.state.selected ? 0.1 : 0}
        strokeWidth={20}
        d={path}
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

export class DeletableLinkFactory extends AbstractLinkFactory {
  constructor() {
    super('default')
  }

  generateReactWidget(diagramEngine, link) {
    return <DeletableLinkWidget link={link} diagramEngine={diagramEngine} />
  }

  getNewInstance() {
    return new DefaultLinkModel()
  }
}
