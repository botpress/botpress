import React from 'react'
import { AbstractLinkFactory, DefaultLinkModel, DefaultLinkWidget, PointModel } from 'storm-react-diagrams'

import style from './style.scss'

class DeletableLinkWidget extends DefaultLinkWidget {
  getAngle(px1, py1, px2, py2) {
    const x = px2 - px1
    const y = py2 - py1
    const hypotenuse = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))
    const cos = x / hypotenuse
    const radian = Math.acos(cos)
    let angle = 180 / (Math.PI / radian)
    if (y < 0) {
      angle = -angle
    } else if (y == 0 && x < 0) {
      angle = 180
    }
    return angle
  }

  addPointToLink = (event: MouseEvent, index: number): void => {
    if (
      !event.shiftKey &&
      !this.props.diagramEngine.isModelLocked(this.props.link) &&
      this.props.link.points.length - 1 <= this.props.diagramEngine.getMaxNumberPointsPerLink()
    ) {
      const point = new PointModel(this.props.link, this.props.diagramEngine.getRelativeMousePoint(event))
      this.forceUpdate()
      this.props.link.addPoint(point, index)
      this.props.pointAdded(point, event)
    }
  }

  generatePoint(pointIndex: number): JSX.Element {
    const { link } = this.props
    const x = link.points[pointIndex].x
    const y = link.points[pointIndex].y
    const pointOne = link.points[pointIndex - 1]
    const pointTwo = link.points[pointIndex]
    const angle = this.getAngle(pointOne.x, pointOne.y, pointTwo.x, pointTwo.y)

    return (
      <g key={'point-' + this.props.link.points[pointIndex].id}>
        {/* <circle
				cx={x}
				cy={y}
				r={5}
				className={
					"point " +
					this.bem("__point") +
					(this.props.link.points[pointIndex].isSelected() ? this.bem("--point-selected") : "")
				}
			/> */}
        <polygon
          x={x - 20}
          y={y + 12}
          transform={`rotate(${angle}, ${x}, ${y})`}
          points={`${x - 10},${y - 8} ${x + 3},${y} ${x - 10},${y + 8}`}
        />
      </g>
    )
  }

  generateLink(path: string, extraProps: any, id: string | number): JSX.Element {
    const { link, diagramEngine } = this.props
    let { color, width } = this.props

    // @ts-ignore
    const flowManager = diagramEngine.flowBuilder.manager
    if (flowManager.shouldHighlightLink(link.getID())) {
      color = 'var(--ocean)'
      width = 4
    }

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

    const deleteBorderWidth = 30
    const removeX = (link.points[0]?.x + link.points[1]?.x) / 2 - deleteBorderWidth / 2
    const removeY = (link.points[0]?.y + link.points[1]?.y) / 2 - deleteBorderWidth / 2
    const showRemove = link.sourcePort && link.targetPort && (this.state.selected || link.isSelected())

    const RemoveLinkButton = (
      <g
        className={style.removeLinkButton}
        onMouseLeave={() => this.setState({ selected: false })}
        onMouseEnter={() => this.setState({ selected: true })}
        onClick={() => {
          link.remove()
          this.props.diagramEngine.repaintCanvas()
        }}
      >
        <rect
          data-linkid={link.getID()}
          x={removeX}
          y={removeY}
          width={deleteBorderWidth}
          height={deleteBorderWidth}
          rx="5"
          opacity={showRemove ? 0.9 : 0}
        />
        {/* no idea how to do this without hardcoding */}
        <svg x={removeX + 6.5} y={removeY + 7}>
          {/* copy pasted blueprint trash icon */}
          <path
            className={style.trash}
            visibility={showRemove ? 'visible' : 'hidden'}
            d="M14.49 3.99h-13c-.28 0-.5.22-.5.5s.22.5.5.5h.5v10c0 .55.45 1 1 1h10c.55 0 1-.45 1-1v-10h.5c.28 0 .5-.22.5-.5s-.22-.5-.5-.5zm-8.5 9c0 .55-.45 1-1 1s-1-.45-1-1v-6c0-.55.45-1 1-1s1 .45 1 1v6zm3 0c0 .55-.45 1-1 1s-1-.45-1-1v-6c0-.55.45-1 1-1s1 .45 1 1v6zm3 0c0 .55-.45 1-1 1s-1-.45-1-1v-6c0-.55.45-1 1-1s1 .45 1 1v6zm2-12h-4c0-.55-.45-1-1-1h-2c-.55 0-1 .45-1 1h-4c-.55 0-1 .45-1 1v1h14v-1c0-.55-.45-1-1-1z"
            fillRule="evenodd"
          ></path>
        </svg>
      </g>
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
