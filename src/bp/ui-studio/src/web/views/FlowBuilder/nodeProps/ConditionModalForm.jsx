import React, { Component } from 'react'
import { Modal, Button, Radio, FormControl, Alert, Form } from 'react-bootstrap'
import Select from 'react-select'
import _ from 'lodash'
import axios from 'axios'
import style from './style.scss'

const availableProps = [
  { label: 'User Data', value: 'user' },
  { label: 'Current User Session', value: 'session' },
  { label: 'Temporary Dialog Context', value: 'temp' }
]

export default class ConditionModalForm extends Component {
  state = {
    typeOfTransition: 'end',
    flowToSubflow: null,
    flowToNode: null,
    transitionError: null,
    conditionError: null,
    conditionType: 'always',
    condition: 'true',
    matchPropsFieldName: '',
    matchPropsExpression: ''
  }

  componentDidMount() {
    this.fetchIntents()

    const subflowOptions = this.props.subflows.filter(flow => !flow.startsWith('skills/')).map(flow => ({
      label: flow,
      value: flow
    }))

    const { currentFlow: flow, currentNodeName } = this.props
    const nodes = (flow && flow.nodes) || []
    const options = nodes
      .filter(({ name }) => name !== currentNodeName)
      .map(({ name }) => ({ label: name, value: name }))

    const nodeOptions = [{ label: 'No specific node', value: null }, ...options]

    this.setState({ subflowOptions, nodeOptions })
  }

  componentDidUpdate(prevProps) {
    if (this.props === prevProps) {
      return
    }

    const { item } = this.props
    const condition = (item && item.condition) || ''
    const conditionType = this.getConditionType(condition)

    if (item && item.node) {
      let typeOfTransition = item.node.indexOf('.') !== -1 ? 'subflow' : 'node'
      typeOfTransition = item.node === 'END' ? 'end' : typeOfTransition
      typeOfTransition = /^#/.test(item.node) ? 'return' : typeOfTransition

      this.setState({
        typeOfTransition,
        conditionType,
        condition,
        flowToSubflow:
          typeOfTransition === 'subflow' ? this.state.subflowOptions.find(x => x.value === item.node) : null,
        flowToNode:
          typeOfTransition === 'node'
            ? this.state.nodeOptions.find(x => x.value === item.node)
            : _.get(this.state.nodeOptions, '[0]'),
        returnToNode: typeOfTransition === 'return' ? item.node.substr(1) : ''
      })
    } else {
      this.resetForm({ condition, conditionType })
    }

    this.setState({ isEdit: Boolean(item) })

    if (conditionType === 'intent') {
      this.extractIntent(condition)
    } else if (conditionType === 'props') {
      this.extractProps(condition)
    }
  }

  getConditionType(condition) {
    condition = condition.trim()

    if (condition === 'true') {
      return 'always'
    } else if (condition.includes('event.nlu.intent.name')) {
      return 'intent'
    } else if (availableProps.some(props => condition.indexOf(props.value + '.') === 0)) {
      return 'props'
    } else {
      return 'raw'
    }
  }

  extractIntent(condition) {
    const intent = condition.match(/'(.*)'/)
    if (intent) {
      this.setState({ matchIntent: { value: intent[1], label: intent[1] } })
    }
  }

  extractProps(condition) {
    const props = condition.match(/(.*)\.(.*?) (.*)/)
    if (props && props.length > 3) {
      this.setState({
        matchPropsType: availableProps.find(x => x.value === props[1]),
        matchPropsFieldName: props[2],
        matchPropsExpression: props[3]
      })
    }
  }

  fetchIntents() {
    return axios.get(`${window.BOT_API_PATH}/mod/nlu/intents`).then(({ data }) => {
      this.setState({ intents: data })
    })
  }

  changeTransitionType(type) {
    this.setState({
      typeOfTransition: type,
      flowToSubflow: this.state.flowToSubflow || _.get(this.state.subflowOptions, '[0]'),
      flowToNode: this.state.flowToNode || _.get(this.state.nodeOptions, '[0]'),
      transitionError: null
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

  resetForm(props) {
    this.setState({
      typeOfTransition: 'node',
      flowToSubflow: null,
      flowToNode: _.get(this.state.nodeOptions, '[0]'),
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

  renderSubflowChoice() {
    return (
      <Select
        name="flowToSubflow"
        value={this.state.flowToSubflow}
        options={this.state.subflowOptions}
        onChange={flowToSubflow => this.setState({ flowToSubflow })}
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

  renderNodesChoice() {
    if (!this.props.currentFlow) {
      return null
    }

    return (
      <Select
        name="flowToNode"
        value={this.state.flowToNode}
        options={this.state.nodeOptions}
        onChange={flowToNode => this.setState({ flowToNode })}
      />
    )
  }

  changeConditionType = event => {
    const conditionType = event.target.value

    if (conditionType === 'always') {
      this.setState({ conditionType, condition: 'true' })
    } else if (conditionType === 'intent') {
      this.setState({ conditionType, condition: `event.nlu.intent.name === ''` })
    } else {
      this.setState({ conditionType })
    }
  }

  handlePropsTypeChanged = option => this.setState({ matchPropsType: option }, this.updatePropertyMatch)
  handlePropsFieldNameChanged = e => this.setState({ matchPropsFieldName: e.target.value }, this.updatePropertyMatch)
  handlePropsExpressionChanged = e => this.setState({ matchPropsExpression: e.target.value }, this.updatePropertyMatch)
  handleConditionChanged = e => this.setState({ condition: e.target.value })

  handleMatchIntentChanged = option => {
    this.setState({
      matchIntent: option,
      condition: `event.nlu.intent.name === '${option.value}'`
    })
  }

  updatePropertyMatch() {
    const { matchPropsType, matchPropsFieldName, matchPropsExpression } = this.state

    if (matchPropsType && matchPropsFieldName && matchPropsExpression) {
      this.setState({
        condition: `${matchPropsType.value}.${matchPropsFieldName} ${matchPropsExpression}`
      })
    }
  }

  renderIntentPicker() {
    if (!this.state.intents) {
      return null
    }

    const intents = this.state.intents.map(({ name }) => ({ label: name, value: name }))
    return (
      <Select
        name="matchIntent"
        value={this.state.matchIntent}
        options={intents}
        onChange={this.handleMatchIntentChanged}
      />
    )
  }

  renderMatchProperty() {
    return (
      <Form inline>
        <Select
          name="matchPropsType"
          value={this.state.matchPropsType}
          options={availableProps}
          onChange={this.handlePropsTypeChanged}
        />

        <FormControl
          type="text"
          placeholder="Field Name (ex: nickname, age)"
          value={this.state.matchPropsFieldName}
          onChange={this.handlePropsFieldNameChanged}
          className={style.textFields}
        />

        <FormControl
          type="text"
          placeholder="Expression (ex: !== undefined)"
          value={this.state.matchPropsExpression}
          onChange={this.handlePropsExpressionChanged}
          className={style.textFields}
        />
      </Form>
    )
  }

  renderRawExpression() {
    return (
      <FormControl
        type="text"
        placeholder="Javascript expression"
        value={this.state.condition}
        onChange={this.handleConditionChanged}
      />
    )
  }

  renderConditions() {
    return (
      <div className={style.section}>
        {this.state.conditionError && <Alert bsStyle="danger">{this.state.conditionError}</Alert>}
        <Radio checked={this.state.conditionType === 'always'} value="always" onChange={this.changeConditionType}>
          Always
        </Radio>

        <Radio checked={this.state.conditionType === 'intent'} value="intent" onChange={this.changeConditionType}>
          Intent is
        </Radio>
        {this.state.conditionType === 'intent' && this.renderIntentPicker()}

        <Radio checked={this.state.conditionType === 'props'} value="props" onChange={this.changeConditionType}>
          Matches Property
        </Radio>
        {this.state.conditionType === 'props' && this.renderMatchProperty()}

        <Radio checked={this.state.conditionType === 'raw'} value="raw" onChange={this.changeConditionType}>
          Raw Expression (advanced)
        </Radio>
        {this.state.conditionType === 'raw' && this.renderRawExpression()}
      </div>
    )
  }

  renderActions() {
    return (
      <div className={style.section}>
        <Radio checked={this.state.typeOfTransition === 'end'} onChange={() => this.changeTransitionType('end')}>
          End flow <span className={style.endBloc} />
        </Radio>
        <Radio checked={this.state.typeOfTransition === 'return'} onChange={() => this.changeTransitionType('return')}>
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
    )
  }

  render() {
    return (
      <Modal animation={false} show={this.props.show} onHide={this.props.onClose} backdrop={'static'}>
        <Modal.Header closeButton>
          <Modal.Title>{this.state.isEdit ? 'Edit' : 'New'} condition to transition</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h5>Condition:</h5>
          {this.renderConditions()}
          <h5>When condition is met, do:</h5>
          {this.renderActions()}
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
