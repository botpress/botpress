import React, { Component } from 'react'
import { Modal, Button, Radio, Col, OverlayTrigger, Tooltip } from 'react-bootstrap'
import Form from 'react-jsonschema-form'
import Select from 'react-select'
import axios from 'axios'

const style = require('./style.scss')

export default class NewActionModal extends Component {
  constructor(props) {
    super(props)

    this.state = {
      actionType: 'message',
      functionSuggestions: [],
      functionInputValue: '',
      messageInputValue: ''
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

  renderGenericParamsFilling() {
    const schema = {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', minLength: 3 },
        description: { type: 'string' }
      }
    }

    const uiSchema = {
      description: {
        'ui:widget': 'textarea'
      }
    }

    function Tpl(props) {
      const { id, classNames, label, help, required, description, rawErrors = [], children } = props
      return (
        <div className={classNames}>
          <label htmlFor={id}>
            {label}
            {required ? '*' : null}
          </label>
          {description}
          {children}
          {rawErrors.map(error => (
            <div style={{ color: 'blue' }}>
              <h1>{error}</h1>
            </div>
          ))}
          {help}
        </div>
      )
    }

    let formData = {
      name: 'actionName',
      decription: 'empty'
    }

    return (
      <div>
        <div>This function has metadata about parameters.</div>
        <Form schema={schema} uiSchema={uiSchema} FieldTemplate={Tpl} formData={formData} liveValidate />
      </div>
    )
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

    return (
      <div>
        <Col sm={4}>Function to invoke:</Col>
        <Col sm={8}>
          <Select
            name="functionToInvoke"
            value={this.state.functionInputValue}
            options={functionSuggestions}
            onChange={val => {
              this.setState({ functionInputValue: val && val.value })
            }}
          />
        </Col>
        <OverlayTrigger placement="bottom" overlay={tooltip}>
          <div className={style.tip}>Not seeing your function here?</div>
        </OverlayTrigger>
        {this.renderGenericParamsFilling()}
      </div>
    )
  }

  renderSectionMessage() {
    // const selectMessageType = <Select
    //         name="functionToInvoke"
    //         value={this.state.messageContentTypeInputValue}
    //         options={this.state.contentTypeSuggestions}
    //         onChange={val => {
    //           this.setState({ messageContentTypeInputValue: val && val.value })
    //         }}
    //       />

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
        <Col sm={4}>Message {help}: </Col>
        <Col sm={8}>
          <input
            type="text"
            name="message"
            placeholder="Message to send"
            value={this.state.messageInputValue}
            onChange={handleChange}
          />
        </Col>
      </div>
    )
  }

  render() {
    const props = this.props

    const onClose = props.onClose || (() => {})
    const onAdd = () =>
      (props.onAdd || (() => {}))({
        type: this.state.actionType,
        functionName: this.state.functionInputValue,
        message: this.state.messageInputValue
      })

    return (
      <Modal animation={false} show={props.show} onHide={onClose}>
        <Modal.Header closeButton>
          <Modal.Title>Add new action</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div>
            <Col sm={4}>The bot will:</Col>
            <Col sm={8}>
              <Radio checked={this.state.actionType === 'message'} onChange={this.onChangeType.bind(this, 'message')}>
                💬 Say something
              </Radio>
              <Radio checked={this.state.actionType === 'code'} onChange={this.onChangeType.bind(this, 'code')}>
                ⚡ Execute code
              </Radio>
            </Col>
          </div>
          <hr />
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
