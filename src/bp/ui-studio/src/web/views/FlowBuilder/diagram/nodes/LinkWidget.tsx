import _ from 'lodash'
import React from 'react'
import { AbstractLinkFactory, DefaultLinkModel, DefaultLinkWidget, PointModel, Toolkit } from 'storm-react-diagrams'

import style from './style.scss'

class DeletableLinkWidget extends DefaultLinkWidget {
  private currentLink: string

  generatePoint(pointIndex: number): JSX.Element {
    const { link } = this.props
    const x = link.points[pointIndex].x
    const y = link.points[pointIndex].y

    this.currentLink = link.getID()

    return (
      <g key={`point-${link.points[pointIndex].id}`}>
        <circle
          cx={x}
          cy={y}
          r={5}
          className={`point ${this.bem('__point')}${
            link.points[pointIndex].isSelected() ? this.bem('--point-selected') : ''
          }`}
        />
        <circle
          onMouseLeave={() => {
            this.setState({ selected: false })
          }}
          onMouseEnter={() => {
            this.setState({ selected: true })
          }}
          data-id={link.points[pointIndex].id}
          data-linkid={link.id}
          cx={x}
          cy={y}
          r={15}
          opacity={0}
          className={`point${this.bem('__point')}`}
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

    let className = ''

    if (this.currentLink === link.getID()) {
      className = this.bem('--path-dragging')
    } else if (this.state.selected || link.isSelected()) {
      className = this.bem('--path-selected')
    }

    const Bottom = (
      <path
        className={className}
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
      <g key={`link${id}`}>
        {Bottom}
        {Top}
        {RemoveLinkButton}
      </g>
    )
  }

  render() {
    const { diagramEngine } = this.props
    if (!diagramEngine.nodesRendered) {
      return null
    }

    // ensure id is present for all points on the path
    const points = this.props.link.points
    const paths = []

    if (this.isSmartRoutingApplicable()) {
      // first step: calculate a direct path between the points being linked
      const directPathCoords = this.pathFinding.calculateDirectPath(_.first(points), _.last(points))

      const routingMatrix = diagramEngine.getRoutingMatrix()
      // now we need to extract, from the routing matrix, the very first walkable points
      // so they can be used as origin and destination of the link to be created
      const smartLink = this.pathFinding.calculateLinkStartEndCoords(routingMatrix, directPathCoords)

      if (smartLink) {
        const { start, end, pathToStart, pathToEnd } = smartLink

        // second step: calculate a path avoiding hitting other elements
        const simplifiedPath = this.pathFinding.calculateDynamicPath(routingMatrix, start, end, pathToStart, pathToEnd)

        paths.push(
          // smooth: boolean, extraProps: any, id: string | number, firstPoint: PointModel, lastPoint: PointModel
          this.generateLink(
            Toolkit.generateDynamicPath(simplifiedPath),
            {
              onMouseDown: event => {
                this.addPointToLink(event, 1)
              }
            },
            '0'
          )
        )
      }
    }

    // true when smart routing was skipped or not enabled.
    // See @link{#isSmartRoutingApplicable()}.
    if (paths.length === 0) {
      if (points.length === 2) {
        const isHorizontal = Math.abs(points[0].x - points[1].x) > Math.abs(points[0].y - points[1].y)
        const xOrY = isHorizontal ? 'x' : 'y'

        // draw the smoothing
        // if the points are too close, just draw a straight line
        let margin = 50
        if (Math.abs(points[0][xOrY] - points[1][xOrY]) < 50) {
          margin = 5
        }

        let pointLeft = points[0]
        let pointRight = points[1]

        // some defensive programming to make sure the smoothing is
        // always in the right direction
        if (pointLeft[xOrY] > pointRight[xOrY]) {
          pointLeft = points[1]
          pointRight = points[0]
        }

        paths.push(
          this.generateLink(
            Toolkit.generateCurvePath(pointLeft, pointRight, this.props.link.curvyness),
            {
              onMouseDown: event => {
                this.addPointToLink(event, 1)
              }
            },
            '0'
          )
        )

        // draw the link as dangeling
        if (this.props.link.targetPort === null) {
          paths.push(this.generatePoint(1))
        }
      } else {
        // draw the multiple anchors and complex line instead
        for (let j = 0; j < points.length - 1; j++) {
          paths.push(
            this.generateLink(
              Toolkit.generateLinePath(points[j], points[j + 1]),
              {
                'data-linkid': this.props.link.id,
                'data-point': j,
                onMouseDown: (event: MouseEvent) => {
                  this.addPointToLink(event, j + 1)
                }
              },
              j
            )
          )
        }

        // render the circles
        for (let i = 1; i < points.length - 1; i++) {
          paths.push(this.generatePoint(i))
        }

        if (this.props.link.targetPort === null) {
          paths.push(this.generatePoint(points.length - 1))
        }
      }
    }

    this.refPaths = []
    return (
      <g {...this.getProps()}>
        {paths}
        {_.map(this.props.link.labels, labelModel => {
          return this.generateLabel(labelModel)
        })}
      </g>
    )
  }
}

export class DeletableLinkFactory extends AbstractLinkFactory {
  constructor() {
    super('default')
  }

  generateReactWidget(diagramEngine, link) {
    return <DeletableLinkWidget link={link} color="var(--gray)" width={2} diagramEngine={diagramEngine} />
  }

  getNewInstance() {
    return new DefaultLinkModel()
  }
}
