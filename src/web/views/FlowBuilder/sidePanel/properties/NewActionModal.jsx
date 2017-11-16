import React, { Component } from 'react'
import { Modal, Button, Radio, Col, OverlayTrigger, Tooltip, Table } from 'react-bootstrap'
import Select from 'react-select'
import axios from 'axios'

import ParametersTable from './ParametersTable'

const style = require('./style.scss')

export default class NewActionModal extends Component {
  constructor(props) {
    super(props)

    this.state = {
      actionType: 'message',
      functionSuggestions: [],
      functionInputValue: '',
      messageInputValue: '',
      arguments: { 1: { key: '', value: '' } }
    }
  }

  componentDidMount() {
    this.fetchAvailableFunctions()
  }

  fetchAvailableFunctions() {
    return axios.get('/flows/available_functions').then(({ data }) => {
      this.setState({ functionSuggestions: data.map(x => ({ label: x.name, value: x.name })) })
    })
  }

  onChangeType(type) {
    this.setState({ actionType: type })
  }

  resetState() {
    this.setState({
      actionType: 'message',
      functionInputValue: '',
      messageInputValue: ''
    })
  }

  renderSectionCode() {
    const { functionSuggestions } = this.state

    const tooltip = (
      <Tooltip id="notSeeingFunction">
        Functions are registered in the code on the server-side. Please make sure that the file containing the functions
        has been properly registered using `bp.registerFunctions('./path/to/file.js')`. This file should return an
        object containing functions.
      </Tooltip>
    )

    const tooltip2 = (
      <Tooltip id="whatIsThis">
        You can provide function calls extra parameters if they have been coded to support them. You can generally
        ignore this for most functions. Please see the documentation to know more.
      </Tooltip>
    )

    const help = (
      <OverlayTrigger placement="bottom" overlay={tooltip}>
        <span className={style.tip}>Missing your function?</span>
      </OverlayTrigger>
    )

    const paramsHelp = (
      <OverlayTrigger placement="bottom" overlay={tooltip2}>
        <span className={style.tip}>What is this?</span>
      </OverlayTrigger>
    )

    return (
      <div>
        <h5>Function to invoke {help}</h5>
        <div className={style.section}>
          <Select
            name="functionToInvoke"
            value={this.state.functionInputValue}
            options={functionSuggestions}
            onChange={val => {
              this.setState({ functionInputValue: val && val.value })
            }}
          />
        </div>
        <h5>Function parameters {paramsHelp}</h5>
        <div className={style.section}>
          <ParametersTable ref={el => (this.parametersTable = el)} />
        </div>
      </div>
    )
  }

  renderSectionMessage() {
    const handleChange = event => {
      this.setState({ messageInputValue: event.target.value })
    }

    const tooltip = (
      <Tooltip id="howMessageWorks">
        You can type a regular message here or you can also provide a valid UMM bloc, for example "#help".
      </Tooltip>
    )

    const help = (
      <OverlayTrigger placement="bottom" overlay={tooltip}>
        <i className="material-icons">help</i>
      </OverlayTrigger>
    )

    return (
      <div>
        <h5>Message {help}:</h5>
        <div className={style.section}>
          <input
            type="text"
            name="message"
            placeholder="Message to send"
            value={this.state.messageInputValue}
            onChange={handleChange}
          />
        </div>
      </div>
    )
  }

  render() {
    const props = this.props
    const noop = () => {}

    const onClose = props.onClose || noop
    const onAdd = () => {
      const handler = props.onAdd || noop
      this.resetState()
      handler({
        type: this.state.actionType,
        functionName: this.state.functionInputValue,
        message: this.state.messageInputValue
      })
    }

    return (
      <Modal animation={false} show={props.show} onHide={onClose}>
        <Modal.Header closeButton>
          <Modal.Title>Add new action</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h5>The bot will:</h5>
          <div className={style.section}>
            <Radio checked={this.state.actionType === 'message'} onChange={this.onChangeType.bind(this, 'message')}>
              💬 Say something
            </Radio>
            <Radio checked={this.state.actionType === 'code'} onChange={this.onChangeType.bind(this, 'code')}>
              ⚡ Execute code
            </Radio>
          </div>

          {this.state.actionType === 'message' ? this.renderSectionMessage() : this.renderSectionCode()}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={onAdd} bsStyle="primary">
            Add Action (Alt+Enter)
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
}
