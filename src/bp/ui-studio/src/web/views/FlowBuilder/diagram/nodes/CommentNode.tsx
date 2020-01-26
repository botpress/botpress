import { Icon, TextArea } from '@blueprintjs/core'
import classnames from 'classnames'
import _ from 'lodash'
import React from 'react'
import { AbstractNodeFactory, DiagramEngine } from 'storm-react-diagrams'

import { BaseNodeModel } from './BaseNodeModel'
const style = require('./style.scss')

export class CommentNodeWidget extends React.Component<{ node: CommentNodeModel; diagramEngine: DiagramEngine }> {
  state = {
    rows: 0,
    text: '',
    isIconVisible: false
  }

  componentDidMount() {
    this.setState({ text: this.props.node.text }, this.updateTextareaHeight)
  }

  handleOnChange = e => {
    this.setState({ text: e.target.value }, this.updateTextareaHeight)
  }

  updateTextareaHeight = () => {
    this.setState({ rows: (_.countBy(this.state.text)['\n'] || 0) + 1 })
  }

  onMouseDown = e => {
    e.stopPropagation()

    const flowBuilder = this.props.diagramEngine['flowBuilder']
    flowBuilder.manager.unselectAllElements()
    this.props.node.setSelected(true)
  }

  onMouseEnter = e => this.setState({ isIconVisible: true })

  onMouseLeave = e => {
    this.setState({ isIconVisible: false })

    const flowBuilder = this.props.diagramEngine['flowBuilder']
    flowBuilder.props.updateFlowNode({ text: this.state.text })
  }

  render() {
    const iconClass = classnames(style.commentIcon, { [style.hidden]: !this.state.isIconVisible })
    return (
      <div>
        <div
          className={classnames(style.commentHeader)}
          onMouseEnter={e => this.setState({ isIconVisible: true })}
          onMouseLeave={e => this.setState({ isIconVisible: false })}
        >
          <Icon className={iconClass} icon="arrows-horizontal" iconSize={Icon.SIZE_LARGE} />
        </div>
        <div>
          <TextArea
            onChange={this.handleOnChange}
            value={this.state.text}
            rows={this.state.rows}
            onMouseDown={this.onMouseDown}
            onMouseEnter={this.onMouseEnter}
            onMouseLeave={this.onMouseLeave}
          />
        </div>
      </div>
    )
  }
}

export class CommentNodeModel extends BaseNodeModel {
  public text: string
  constructor({ id, x, y, text }) {
    super('comment', id)
    this.next = []
    this.text = text
    this.x = this.oldX = x
    this.y = this.oldY = y
  }

  getPorts() {
    return {}
  }

  serialize() {
    return _.merge(super.serialize(), {
      text: this.text
    })
  }

  deSerialize(data, engine) {
    super.deSerialize(data, engine)

    this.text = data.text
  }
}

export const CommentNodeWidgetFactory = React.createFactory(CommentNodeWidget)

export class CommentWidgetFactory extends AbstractNodeFactory {
  constructor() {
    super('comment')
  }

  generateReactWidget(diagramEngine: DiagramEngine, node: CommentNodeModel) {
    return <CommentNodeWidget node={node} diagramEngine={diagramEngine} />
  }

  getNewInstance() {
    // @ts-ignore
    return new CommentNodeModel()
  }
}
