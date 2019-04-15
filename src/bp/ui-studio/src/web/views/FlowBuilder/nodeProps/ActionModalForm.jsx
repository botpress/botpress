import React, { Component } from 'react'
import { Modal, Button, Radio, OverlayTrigger, Tooltip } from 'react-bootstrap'
import Markdown from 'react-markdown'
import axios from 'axios'
import _ from 'lodash'

import { LinkDocumentationProvider } from '~/components/Util/DocumentationProvider'

import SelectActionDropdown from './SelectActionDropdown'
import ParametersTable from './ParametersTable'
import ContentPickerWidget from '~/components/Content/Select/Widget'

const style = require('./style.scss')

export default class ActionModalForm extends Component {
  state = {
    actionType: 'message',
    avActions: [],
    actionMetadata: {},
    functionInputValue: '',
    messageValue: '',
    functionParams: {}
  }

  textToItemId = text => _.get(text.match(/^say #!(.*)$/), '[1]')

  componentWillReceiveProps(nextProps) {
    const { item } = nextProps

    if (this.props.show || !nextProps.show) {
      return
    }

    if (item) {
      this.setState({
        actionType: nextProps.item.type,
        functionInputValue:
          this.state.avActions && this.state.avActions.find(x => x.value === nextProps.item.functionName),
        messageValue: nextProps.item.message,
        functionParams: nextProps.item.parameters
      })
    } else {
      this.resetForm()
    }
    this.setState({ isEdit: Boolean(item) })
  }

  componentDidMount() {
    this.fetchAvailableFunctions()
  }

  fetchAvailableFunctions() {
    return axios.get(`${window.BOT_API_PATH}/actions`).then(({ data }) => {
      this.setState({
        avActions: data.filter(action => !action.metadata.hidden).map(x => {
          return { label: x.name, value: x.name, metadata: x.metadata }
        })
      })
    })
  }

  onChangeType = type => () => {
    this.setState({ actionType: type })
  }

  resetForm() {
    this.setState({
      actionType: 'message',
      functionInputValue: '',
      messageValue: ''
    })
  }

  renderSectionAction() {
    const { avActions } = this.state

    const tooltip = (
      <Tooltip id="notSeeingAction">
        Actions are registered on the server-side. Read about how to register new actions by searching for
        `bp.registerActions()`.
      </Tooltip>
    )

    const tooltip2 = (
      <Tooltip id="whatIsThis">
        You can change how the Action is executed by providing it parameters. Some parameters are required, some are
        optional.
      </Tooltip>
    )

    const help = (
      <OverlayTrigger placement="bottom" overlay={tooltip}>
        <span className={style.tip}>Can&apos;t see your action?</span>
      </OverlayTrigger>
    )

    const paramsHelp = <LinkDocumentationProvider file="memory" />

    const onParamsChange = params => {
      params = _.values(params).reduce((sum, n) => {
        if (n.key === '') {
          return sum
        }
        return { ...sum, [n.key]: n.value }
      }, {})
      this.setState({ functionParams: params })
    }

    // const args = JSON.stringify(this.state.functionParams, null, 4)

    return (
      <div>
        <h5>Action to run {help}</h5>
        <div className={style.section}>
          <SelectActionDropdown
            value={this.state.functionInputValue}
            options={avActions}
            onChange={val => {
              const fn = avActions.find(fn => fn.value === (val && val.value))
              const paramsDefinition = _.get(fn, 'metadata.params') || []
              this.setState({
                functionInputValue: val,
                paramsDef: paramsDefinition,
                actionMetadata: fn.metadata || {}
              })

              // TODO Detect if default or custom arguments
              if (
                Object.keys(this.state.functionParams || {}).length > 0 &&
                !confirm('Do you want to overwrite existing parameters?')
              ) {
                return
              }

              this.setState({
                functionParams: _.fromPairs(paramsDefinition.map(param => [param.name, param.default || '']))
              })
            }}
          />
          {this.state.actionMetadata.title && <h4>{this.state.actionMetadata.title}</h4>}
          {this.state.actionMetadata.description && <Markdown source={this.state.actionMetadata.description} />}
        </div>
        <h5>Action parameters {paramsHelp}</h5>
        <div className={style.section}>
          <ParametersTable
            ref={el => (this.parametersTable = el)}
            onChange={onParamsChange}
            value={this.state.functionParams}
            definitions={this.state.paramsDef}
          />
        </div>
      </div>
    )
  }

  renderSectionMessage() {
    const handleChange = item => {
      this.setState({ messageValue: `say #!${item.id}` })
    }

    const itemId = this.textToItemId(this.state.messageValue)

    return (
      <div>
        <h5>Message:</h5>
        <div className={style.section}>
          <ContentPickerWidget itemId={itemId} onChange={handleChange} placeholder="Message to send" />
        </div>
      </div>
    )
  }

  handleKeyDown = e => {
    if (e.altKey && e.key == 'Enter') {
      e.preventDefault()
      this.onSubmit()
    }
  }

  onSubmit = () => {
    this.resetForm()
    this.props.onSubmit &&
      this.props.onSubmit({
        type: this.state.actionType,
        functionName: this.state.functionInputValue && this.state.functionInputValue.value,
        message: this.state.messageValue,
        parameters: this.state.functionParams
      })
  }

  onClose = () => {
    this.props.onClose && this.props.onClose()
  }

  render() {
    return (
      <Modal
        animation={false}
        show={this.props.show}
        onHide={this.onClose}
        container={document.getElementById('app')}
        onKeyDown={this.handleKeyDown}
        backdrop={'static'}
      >
        <Modal.Header closeButton>
          <Modal.Title>{this.state.isEdit ? 'Edit' : 'Add new'} action</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h5>The bot will:</h5>
          <div className={style.section}>
            <Radio checked={this.state.actionType === 'message'} onChange={this.onChangeType('message')}>
              💬 Say something
            </Radio>
            <Radio checked={this.state.actionType === 'code'} onChange={this.onChangeType('code')}>
              ⚡ Execute code <LinkDocumentationProvider file="action" />
            </Radio>
          </div>

          {this.state.actionType === 'message' ? this.renderSectionMessage() : this.renderSectionAction()}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.onClose}>Cancel</Button>
          <Button onClick={this.onSubmit} bsStyle="primary">
            {this.state.isEdit ? 'Update' : 'Add'} Action (Alt+Enter)
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
}
