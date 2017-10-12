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

import { StandardNodeModel, StandardWidgetFactory } from './nodes/StandardNode'

const style = require('./style.scss')

export default class FlowBuilder extends Component {
  constructor(props) {
    super(props)
    this.state = {}

    this.diagramEngine = new DiagramEngine()

    this.diagramEngine.registerNodeFactory(new DefaultNodeFactory())
    this.diagramEngine.registerNodeFactory(new StandardWidgetFactory())

    this.diagramEngine.registerLinkFactory(new DefaultLinkFactory())

    this.newModel()
  }

  setTranslation(x = 0, y = 0) {
    this.activeModel.setOffset(x, y)
    this.diagramWidget.fireAction()
    this.diagramWidget.forceUpdate()
  }

  serialize() {
    return this.activeModel.serializeDiagram()
  }

  newModel() {
    this.activeModel = new DiagramModel()

    this.activeModel.setGridSize(25)

    this.diagramEngine.setDiagramModel(this.activeModel)

    var node1 = new DefaultNodeModel('Node 1', 'rgb(0,192,255)')
    var port1 = node1.addPort(new DefaultPortModel(false, 'out-1', 'Out'))
    node1.x = 100
    node1.y = 100

    var username = new StandardNodeModel({
      name: 'username',
      onEnter: ['@I need your username!'],
      onReceive: ['onUsernameData', '@ You said that you are {{username}}'],
      next: [
        {
          condition: 'true',
          node: 'password'
        }
      ]
    })

    var password = new StandardNodeModel({
      name: 'password',
      onEnter: ['@Please enter your password'],
      onReceive: ['something', 'onPasswordData'],
      next: [
        {
          condition: 'true',
          node: 'authentication'
        }
      ]
    })

    var authentication = new StandardNodeModel({
      name: 'authentication',
      onEnter: ['onEnterAuthentication'],
      next: [
        {
          condition: 'isAuthenticated(userState)===true',
          node: '#loginSuccess'
        },
        {
          condition: 'isAuthenticated(userState)===false',
          node: '#loginFailure'
        }
      ]
    })

    username.x = authentication.x = password.x = 400

    username.y = 200
    password.y = 500
    authentication.y = 800

    var link1 = new LinkModel()
    link1.setSourcePort(username.ports['out0'])
    link1.setTargetPort(password.ports['in'])

    this.activeModel.addNode(node1)
    this.activeModel.addNode(username)
    this.activeModel.addNode(password)
    this.activeModel.addNode(authentication)

    this.activeModel.addLink(link1)
  }

  getSelectedNode() {
    return _.first(this.activeModel.getSelectedItems() || [], { selected: true })
  }

  componentDidMount() {}

  render() {
    return <DiagramWidget ref={w => (this.diagramWidget = w)} diagramEngine={this.diagramEngine} />
  }
}
