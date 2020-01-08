import { TextArea } from '@blueprintjs/core'
import classnames from 'classnames'
import _ from 'lodash'
import React from 'react'
import { AbstractNodeFactory, DiagramEngine } from 'storm-react-diagrams'

import { BaseNodeModel } from './BaseNodeModel'
const style = require('./style.scss')

export class CommentNodeWidget extends React.Component<{ node: CommentNodeModel; diagramEngine: DiagramEngine }> {
  state = {
    rows: 0,
    text: ''
  }

  componentDidMount() {
    this.setState({ text: this.props.node.text }, this.updateTextareaHeight)
  }

  handleKeyDown = event => {
    if (event.key === 'Enter') {
      this.setState({ text: this.state.text + '\n' }, this.updateTextareaHeight)

      event.preventDefault()
    }
  }

  handleOnChange = event => {
    this.setState({ text: event.target.value }, this.updateTextareaHeight)
  }

  handleOnBlur = () => {
    const flowBuilder = this.props.diagramEngine['flowBuilder']
    flowBuilder.updateCommentText(this.state.text)
  }

  updateTextareaHeight = () => {
    this.setState({ rows: (_.countBy(this.state.text)['\n'] || 0) + 1 })
  }

  render() {
    const className = classnames(style.comment)

    return (
      <TextArea className={className} onChange={this.handleOnChange} value={this.state.text} rows={this.state.rows} />
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
