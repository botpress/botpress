import React from 'react'
import { AbstractLinkFactory, DefaultLinkModel, DefaultLinkWidget, PointModel } from 'storm-react-diagrams'

class DeletableLinkWidget extends DefaultLinkWidget {
  generateLink(path: string, extraProps: any, id: string | number): JSX.Element {
    const { link, width, color } = this.props

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
        data-linkid={link.getID()}
        stroke={color}
        strokeOpacity={this.state.selected ? 0.1 : 0}
        strokeWidth={10}
        d={path}
        {...extraProps}
      />
    )

    const removeX = (link.points[0]?.x + link.points[1]?.x) / 2
    const removeY = (link.points[0]?.y + link.points[1]?.y) / 2
    const showRemove = link.sourcePort && link.targetPort

    // TODO: replace by garban can once we have the design
    const RemoveLinkButton = (
      <circle
        data-linkid={link.getID()}
        cx={removeX}
        cy={removeY}
        onMouseLeave={() => this.setState({ selected: false })}
        onMouseEnter={() => this.setState({ selected: true })}
        r="15"
        fill="red"
        fillOpacity={showRemove && (this.state.selected || link.isSelected()) ? 0.5 : 0}
        onClick={() => {
          link.remove()
          this.props.diagramEngine.repaintCanvas()
        }}
      />
    )

    return (
      <g key={'link-' + id}>
        {Bottom}
        {Top}
        {RemoveLinkButton}
      </g>
    )
  }
}

export class DeletableLinkFactory extends AbstractLinkFactory {
  constructor() {
    super('default')
  }

  generateReactWidget(diagramEngine, link) {
    return <DeletableLinkWidget link={link} color="#bec5c9" width={2} diagramEngine={diagramEngine} />
  }

  getNewInstance() {
    return new DefaultLinkModel()
  }
}
