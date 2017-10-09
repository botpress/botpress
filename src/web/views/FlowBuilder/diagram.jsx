import React, { Component } from 'react'
import classnames from 'classnames'
import axios from 'axios'
import _ from 'lodash'

const {
  DiagramWidget,
  DiagramEngine,
  DefaultNodeFactory,
  DefaultLinkFactory,
  DiagramModel,
  DefaultNodeModel,
  DefaultPortModel,
  LinkModel
} = require('storm-react-diagrams')

const style = require('./style.scss')

export default class FlowBuilder extends Component {
  constructor(props) {
    super(props)
    this.state = {}

    this.diagramEngine = new DiagramEngine()
    this.diagramEngine.registerNodeFactory(new DefaultNodeFactory())
    this.diagramEngine.registerLinkFactory(new DefaultLinkFactory())

    this.newModel()
  }

  newModel() {
    this.activeModel = new DiagramModel()
    this.diagramEngine.setDiagramModel(this.activeModel)

    var node1 = new DefaultNodeModel('Node 1', 'rgb(0,192,255)')
    var port1 = node1.addPort(new DefaultPortModel(false, 'out-1', 'Out'))
    node1.x = 100
    node1.y = 100

    var node2 = new DefaultNodeModel('Node 2', 'rgb(192,255,0)')
    var port2 = node2.addPort(new DefaultPortModel(true, 'in-1', 'IN'))
    node2.x = 400
    node2.y = 100

    var link1 = new LinkModel()
    link1.setSourcePort(port1)
    link1.setTargetPort(port2)

    this.activeModel.addNode(node1)
    this.activeModel.addNode(node2)
    this.activeModel.addLink(link1)
  }

  componentDidMount() {}

  render() {
    return <DiagramWidget diagramEngine={this.diagramEngine} />
  }
}
