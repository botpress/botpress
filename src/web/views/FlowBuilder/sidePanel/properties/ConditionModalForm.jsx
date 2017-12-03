import React, { Component } from 'react'
import { Modal, Button, Radio, FormControl, Alert } from 'react-bootstrap'
import Select from 'react-select'
import _ from 'lodash'

const style = require('./style.scss')

export default class ConditionModalForm extends Component {
  constructor(props) {
    super(props)

    this.state = {
      typeOfTransition: 'end',
      flowToSubflow: null,
      flowToNode: null,
      transitionError: null,
      conditionError: null
    }
  }

  componentWillReceiveProps(nextProps) {
    const { item } = nextProps

    if (this.props.show || !nextProps.show) {
      return
    }

    if (item) {
      let typeOfTransition = item.node.indexOf('.') !== -1 ? 'subflow' : 'node'
      typeOfTransition = item.node === 'END' ? 'end' : typeOfTransition

      this.setState({
        typeOfTransition,
        condition: item.condition,
        flowToSubflow: typeOfTransition === 'subflow' ? item.node : null,
        flowToNode: typeOfTransition === 'node' ? { label: item.node, value: item.node } : null
      })
    } else {
      this.resetForm()
    }
    this.setState({ isEdit: Boolean(item) })
  }

  changeTransitionType(type) {
    const subflowOptions = this.getSubflowOptions()
    const nodeOptions = this.getNodeOptions()
    this.setState({
      typeOfTransition: type,
      flowToSubflow: this.state.flowToSubflow || (subflowOptions && subflowOptions[0]),
      flowToNode: this.state.flowToNode || (nodeOptions && nodeOptions[0])
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

  resetForm() {
    this.setState({
      typeOfTransition: 'end',
      flowToSubflow: null,
      flowToNode: null,
      conditionError: null,
      transitionError: null,
      condition: ''
    })
  }

  onSubmitClick() {
    if (this.validation()) {
      const payload = { condition: this.state.condition }

      if (this.state.typeOfTransition === 'subflow') {
        payload.node = this.state.flowToSubflow.value
      } else if (this.state.typeOfTransition === 'end') {
        payload.node = 'END'
      } else if (this.state.typeOfTransition === 'node') {
        payload.node = _.get(this.state, 'flowToNode.value') || ''
      } else {
        payload.node = ''
      }

      this.props.onSubmit(payload)
      this.resetForm()
    }
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

  onConditionChanged(event) {
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
            <Radio checked={true}>Raw Expression</Radio>
            <FormControl
              type="text"
              placeholder="Javascript expression"
              value={this.state.condition}
              onChange={::this.onConditionChanged}
            />
          </div>
          <h5>When condition is met, do:</h5>
          <div className={style.section}>
            <Radio checked={this.state.typeOfTransition === 'end'} onChange={() => this.changeTransitionType('end')}>
              End flow <span className={style.endBloc} />
            </Radio>
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
          <Button onClick={::this.onSubmitClick} bsStyle="primary">
            {this.state.isEdit ? 'Update' : 'Create'}
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
}
