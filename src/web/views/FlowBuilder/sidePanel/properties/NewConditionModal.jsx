import React, { Component } from 'react'
import { Modal, Button, Radio, FormControl, Alert } from 'react-bootstrap'
import Select from 'react-select'
import _ from 'lodash'

const style = require('./style.scss')

export default class NewConditionModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      typeOfTransition: 'end',
      flowToSubflow: null,
      transitionError: null,
      conditionError: null
    }
  }

  changeTransitionType(type) {
    const subflowOptions = this.getSubflowOptions()
    this.setState({
      typeOfTransition: type,
      flowToSubflow: this.state.flowToSubflow || (subflowOptions && subflowOptions[0])
    })
  }

  validation() {
    if (this.state.typeOfTransition === 'subflow' && !this.state.flowToSubflow) {
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
      conditionError: null,
      transitionError: null,
      condition: ''
    })
  }

  onAddClick() {
    console.log('On add click')
    if (this.validation()) {
      this.props.onAdd({ ...this.state })
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

  onConditionChanged(event) {
    this.setState({ condition: event.target.value })
  }

  render() {
    return (
      <Modal animation={false} show={this.props.show} onHide={this.props.onClose}>
        <Modal.Header closeButton>
          <Modal.Title>New condition to transition</Modal.Title>
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
          <Button onClick={::this.onAddClick} bsStyle="primary">
            Add Condition
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
}
