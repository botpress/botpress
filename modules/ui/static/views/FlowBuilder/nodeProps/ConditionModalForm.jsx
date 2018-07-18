import React, { Component } from 'react'
import { Modal, Button, Radio, FormControl, Alert } from 'react-bootstrap'
import Select from 'react-select'
import _ from 'lodash'

const style = require('./style.scss')

export default class ConditionModalForm extends Component {
  state = {
    typeOfTransition: 'end',
    flowToSubflow: null,
    flowToNode: null,
    transitionError: null,
    conditionError: null
  }

  componentWillReceiveProps(nextProps) {
    const { item } = nextProps

    if (this.props.show || !nextProps.show) {
      return
    }

    if (item && item.node) {
      let typeOfTransition = item.node.indexOf('.') !== -1 ? 'subflow' : 'node'
      typeOfTransition = item.node === 'END' ? 'end' : typeOfTransition
      typeOfTransition = /^#/.test(item.node) ? 'return' : typeOfTransition

      this.setState({
        typeOfTransition,
        condition: item.condition,
        flowToSubflow: typeOfTransition === 'subflow' ? item.node : null,
        flowToNode: typeOfTransition === 'node' ? item.node : null,
        returnToNode: typeOfTransition === 'return' ? item.node.substr(1) : ''
      })
    } else {
      this.resetForm({ condition: (item && item.condition) || '' })
    }

    this.setState({ isEdit: Boolean(item) })
  }

  changeTransitionType(type) {
    const subflowOptions = this.getSubflowOptions()
    const nodeOptions = this.getNodeOptions()
    this.setState({
      typeOfTransition: type,
      flowToSubflow: this.state.flowToSubflow || _.get(subflowOptions, '[0].value'),
      flowToNode: this.state.flowToNode || _.get(nodeOptions, '[0].value')
    })
  }

  validation() {
    if (this.state.typeOfTransition === 'subflow' && !this.state.flowToSubflow) {
      this.setState({
        transitionError: 'You must select a subflow to transition to'
      })

      return false
    }

    if (this.state.typeOfTransition === 'node' && !this.state.flowToNode && this.getNodeOptions().length > 0) {
      this.setState({
        transitionError: 'You must select a subflow to transition to'
      })

      return false
    }

    if (_.isEmpty(this.state.condition)) {
      this.setState({
        conditionError: 'Specify a condition'
      })

      return false
    }

    this.setState({
      conditionError: null,
      transitionError: null
    })

    return true
  }

  resetForm(props) {
    this.setState({
      typeOfTransition: 'node',
      flowToSubflow: null,
      flowToNode: null,
      returnToNode: '',
      conditionError: null,
      transitionError: null,
      condition: '',
      ...props
    })
  }

  onSubmitClick = () => {
    if (!this.validation()) {
      return
    }
    const payload = { condition: this.state.condition }

    if (this.state.typeOfTransition === 'subflow') {
      payload.node = _.get(this.state, 'flowToSubflow.value') || _.get(this.state, 'flowToSubflow')
    } else if (this.state.typeOfTransition === 'end') {
      payload.node = 'END'
    } else if (this.state.typeOfTransition === 'node') {
      let earlierNode = this.state.isEdit && _.get(this.props, 'item.node')

      if (
        earlierNode &&
        (/^END$/i.test(earlierNode) || earlierNode.startsWith('#') || /\.flow\.json/i.test(earlierNode))
      ) {
        earlierNode = null
      }

      payload.node = _.get(this.state, 'flowToNode.value') || earlierNode || ''
    } else if (this.state.typeOfTransition === 'return') {
      payload.node = '#' + this.state.returnToNode
    } else {
      payload.node = ''
    }

    this.props.onSubmit(payload)
    this.resetForm()
  }

  getSubflowOptions() {
    return this.props.subflows.map(flow => ({
      label: flow,
      value: flow
    }))
  }

  renderSubflowChoice() {
    return (
      <Select
        name="flowToSubflow"
        value={this.state.flowToSubflow}
        options={this.getSubflowOptions()}
        onChange={val => {
          this.setState({ flowToSubflow: val && val.value })
        }}
      />
    )
  }

  renderReturnToNode() {
    const updateNode = value =>
      this.setState({
        returnToNode: value
      })

    return (
      <div className={style.returnToNodeSection}>
        <div>Return to node called:</div>
        <input type="text" value={this.state.returnToNode} onChange={e => updateNode(e.target.value)} />
        <div>
          <input
            type="checkbox"
            id="rPreviousNode"
            checked={_.isEmpty(this.state.returnToNode)}
            onChange={() => updateNode('')}
          />
          <label htmlFor="rPreviousNode">Return to calling node</label>
        </div>
      </div>
    )
  }

  getNodeOptions() {
    const flow = this.props.currentFlow
    return (flow && flow.nodes.map(({ name }) => ({ label: name, value: name }))) || []
  }

  renderNodesChoice() {
    if (!this.props.currentFlow) {
      return null
    }

    const nodeOptions = this.getNodeOptions()
    return (
      <Select
        name="flowToNode"
        value={this.state.flowToNode}
        options={nodeOptions}
        onChange={flowToNode => this.setState({ flowToNode })}
      />
    )
  }

  onConditionChanged = event => {
    this.setState({ condition: event.target.value })
  }

  render() {
    return (
      <Modal animation={false} show={this.props.show} onHide={this.props.onClose}>
        <Modal.Header closeButton>
          <Modal.Title>{this.state.isEdit ? 'Edit' : 'New'} condition to transition</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h5>Condition:</h5>
          <div className={style.section}>
            {this.state.conditionError && <Alert bsStyle="danger">{this.state.conditionError}</Alert>}
            <Radio defaultChecked={true}>Raw Expression</Radio>
            <FormControl
              type="text"
              placeholder="Javascript expression"
              value={this.state.condition}
              onChange={this.onConditionChanged}
            />
          </div>
          <h5>When condition is met, do:</h5>
          <div className={style.section}>
            <Radio checked={this.state.typeOfTransition === 'end'} onChange={() => this.changeTransitionType('end')}>
              End flow <span className={style.endBloc} />
            </Radio>
            <Radio
              checked={this.state.typeOfTransition === 'return'}
              onChange={() => this.changeTransitionType('return')}
            >
              Return to previous flow <span className={style.returnBloc} />
            </Radio>
            {this.state.typeOfTransition === 'return' && this.renderReturnToNode()}
            <Radio checked={this.state.typeOfTransition === 'node'} onChange={() => this.changeTransitionType('node')}>
              Transition to node <span className={style.nodeBloc} />
            </Radio>
            {this.state.typeOfTransition === 'node' && this.renderNodesChoice()}
            <Radio
              checked={this.state.typeOfTransition === 'subflow'}
              onChange={() => this.changeTransitionType('subflow')}
            >
              Transition to subflow <span className={style.subflowBloc} />
            </Radio>
            {this.state.transitionError && <Alert bsStyle="danger">{this.state.transitionError}</Alert>}
            {this.state.typeOfTransition === 'subflow' && this.renderSubflowChoice()}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.props.onClose}>Cancel</Button>
          <Button onClick={this.onSubmitClick} bsStyle="primary">
            {this.state.isEdit ? 'Update' : 'Create'}
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
}
