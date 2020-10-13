import _ from 'lodash'
import React from 'react'
import {
  DiagramProps,
  DiagramWidget,
  LinkLayerWidget,
  LinkModel,
  MoveCanvasAction,
  MoveItemsAction,
  NodeLayerWidget,
  NodeModel,
  PointModel,
  PortModel,
  SelectingAction
} from 'storm-react-diagrams'

function contains(a, b) {
  return !(b.left < a.left || b.top < a.top || b.right > a.right || b.bottom > a.bottom)
}

function overlaps(a, b) {
  if (a.left >= b.right || b.left >= a.right) {
    return false
  }

  if (a.top >= b.bottom || b.top >= a.bottom) {
    return false
  }

  return true
}

function touches(a, b) {
  if (a.left > b.right || b.left > a.right) {
    return false
  }

  if (a.top > b.bottom || b.top > a.bottom) {
    return false
  }

  return true
}

interface OwnProps {
  setMagnetableNodes?: (nodeIds: string[]) => void
}

type Props = DiagramProps & OwnProps

class OverwriteDiagramWidget extends DiagramWidget {
  diagramEngine
  diagramModel
  nodes
  nodesPositions
  public static defaultProps: Props = {
    diagramEngine: null,
    allowLooseLinks: true,
    allowCanvasTranslation: true,
    allowCanvasZoom: true,
    inverseZoom: false,
    maxNumberPointsPerLink: Infinity, // backwards compatible default
    smartRouting: false,
    deleteKeys: [46, 8]
  }

  constructor(props: Props) {
    super(props)
  }

  componentWillUpdate(nextProps: Props) {
    super.componentWillUpdate(nextProps)
    this.diagramEngine = this.props.diagramEngine
    this.diagramModel = this.diagramEngine.getDiagramModel()
    this.nodes = this.diagramModel.getNodes()
    this.nodesPositions = Object.keys(this.nodes).reduce((acc, id) => {
      const node = this.nodes[id]
      return {
        ...acc,
        [id]: {
          left: node.x - 20,
          top: node.y - 20,
          bottom: node.y + node.height + 20,
          right: node.x + node.width + 20,
          node
        }
      }
    }, {})
  }

  onMouseMove(event) {
    // select items so draw a bounding box
    if (this.state.action instanceof SelectingAction) {
      const relative = this.diagramEngine.getRelativePoint(event.clientX, event.clientY)

      _.forEach(this.diagramModel.getNodes(), node => {
        if ((this.state.action as SelectingAction).containsElement(node.x, node.y, this.diagramModel)) {
          node.setSelected(true)
        }
      })

      _.forEach(this.diagramModel.getLinks(), link => {
        let allSelected = true
        _.forEach(link.points, point => {
          if ((this.state.action as SelectingAction).containsElement(point.x, point.y, this.diagramModel)) {
            point.setSelected(true)
          } else {
            allSelected = false
          }
        })

        if (allSelected) {
          link.setSelected(true)
        }
      })

      this.state.action.mouseX2 = relative.x
      this.state.action.mouseY2 = relative.y

      this.fireAction()
      this.setState({ action: this.state.action })
      return
    } else if (this.state.action instanceof MoveItemsAction) {
      const amountX = event.clientX - this.state.action.mouseX
      const amountY = event.clientY - this.state.action.mouseY
      const amountZoom = this.diagramModel.getZoomLevel() / 100

      _.forEach(this.state.action.selectionModels, model => {
        // in this case we need to also work out the relative grid position
        if (
          model.model instanceof NodeModel ||
          (model.model instanceof PointModel && !model.model.isConnectedToPort())
        ) {
          const newX = this.diagramModel.getGridPosition(model.initialX + amountX / amountZoom)
          const newY = this.diagramModel.getGridPosition(model.initialY + amountY / amountZoom)
          const newBottom = newY + model.model['height']
          const newRight = newX + model.model['width']

          const nodePositions = Object.keys(this.nodesPositions)
            .filter(id => id !== model.model.id)
            .reduce((acc, id) => [...acc, this.nodesPositions[id]], [])
          const modelPosition = { left: newX, top: newY, right: newRight, bottom: newBottom }

          const magnetableNodes = []

          nodePositions.forEach(nodePosition => {
            if (
              contains(nodePosition, modelPosition) ||
              overlaps(nodePosition, modelPosition) ||
              touches(nodePosition, modelPosition)
            ) {
              magnetableNodes.push(nodePosition.node.id)
            }
          })
          this.props['setMagnetableNodes']?.(magnetableNodes)

          model.model.x = newX
          model.model.y = newY

          // update port coordinates as well
          if (model.model instanceof NodeModel) {
            _.forEach(model.model.getPorts(), port => {
              const portCoords = this.props.diagramEngine.getPortCoords(port)
              port.updateCoords(portCoords)
            })
          }

          if (this.diagramEngine.isSmartRoutingEnabled()) {
            this.diagramEngine.calculateRoutingMatrix()
          }
        } else if (model.model instanceof PointModel) {
          // we want points that are connected to ports, to not necessarily snap to grid
          // this stuff needs to be pixel perfect, dont touch it
          model.model.x = model.initialX + this.diagramModel.getGridPosition(amountX / amountZoom)
          model.model.y = model.initialY + this.diagramModel.getGridPosition(amountY / amountZoom)
        }
      })

      if (this.diagramEngine.isSmartRoutingEnabled()) {
        this.diagramEngine.calculateCanvasMatrix()
      }

      this.fireAction()
      if (!this.state.wasMoved) {
        this.setState({ wasMoved: true })
      } else {
        this.forceUpdate()
      }
    } else if (this.state.action instanceof MoveCanvasAction) {
      // translate the actual canvas
      if (this.props.allowCanvasTranslation) {
        this.diagramModel.setOffset(
          this.state.action.initialOffsetX + (event.clientX - this.state.action.mouseX),
          this.state.action.initialOffsetY + (event.clientY - this.state.action.mouseY)
        )
        this.fireAction()
        this.forceUpdate()
      }
    }
  }
}

export default OverwriteDiagramWidget
