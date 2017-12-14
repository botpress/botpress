import React, { Component } from 'react'
import { Modal, Button, Radio, OverlayTrigger, Tooltip, Panel, Well } from 'react-bootstrap'
import Select from 'react-select'
import axios from 'axios'
import _ from 'lodash'
import { connect } from 'react-redux'

import { fetchContentItem, upsertContentItems } from '~/actions'

import ParametersTable from './ParametersTable'
import CreateOrEditModal from '../../../Content/modal'

const style = require('./style.scss')

class ActionModalForm extends Component {
  constructor(props) {
    super(props)

    this.state = {
      actionType: 'message',
      functionSuggestions: [],
      functionInputValue: '',
      messageValue: '',
      functionParams: {},
      itemId: props.item && this.textToItemId(props.item.message),
      showItemEdit: false,
      contentToEdit: null
    }
    props.item && this.fetchItem(props.item.message)
  }

  textToItemId = text => _.get(text.match(/^say #!(.*)$/), '[1]')

  fetchItem = text => {
    const itemId = this.textToItemId(text)
    this.setState({ itemId })
    if (itemId) {
      this.props.fetchContentItem(itemId)
    }
  }

  componentWillReceiveProps(nextProps) {
    const { item } = nextProps

    if (this.props.show || !nextProps.show) {
      return
    }

    if (item) {
      this.setState({
        actionType: nextProps.item.type,
        functionInputValue: nextProps.item.functionName,
        messageValue: nextProps.item.message,
        functionParams: nextProps.item.parameters
      })

      this.fetchItem(nextProps.item.message)
    } else {
      this.resetForm()
    }
    this.setState({ isEdit: Boolean(item) })
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

  resetForm() {
    this.setState({
      actionType: 'message',
      functionInputValue: '',
      messageValue: ''
    })
  }

  handleUpdate = () => {
    const categoryId = this.props.contentItems[this.state.itemId].categoryId
    this.props
      .upsertContentItems({ modifyId: this.state.itemId, categoryId, formData: this.state.contentToEdit })
      .then(() => this.props.fetchContentItem(this.state.itemId))
      .then(() => this.setState({ showItemEdit: false, contentToEdit: null }))
  }

  handleFormEdited = data => {
    this.setState({ contentToEdit: data })
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

    const onParamsChange = params => {
      params = _.values(params).reduce((sum, n) => {
        if (n.key === '') {
          return sum
        }
        return { ...sum, [n.key]: n.value }
      }, {})
      this.setState({ functionParams: params })
    }

    const args = JSON.stringify(this.state.functionParams, null, 4)

    const callPreview = `${this.state.functionInputValue}(state, event, ${args})`

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
          <ParametersTable
            ref={el => (this.parametersTable = el)}
            onChange={onParamsChange}
            value={this.state.functionParams}
          />
        </div>

        <h5>Preview</h5>
        <div className={style.section}>
          <pre>{callPreview}</pre>
        </div>
      </div>
    )
  }

  editItem = () => {
    const contentItem = this.props.contentItems[this.state.itemId]
    this.setState({ showItemEdit: true, contentToEdit: (contentItem && contentItem.formData) || {} })
  }

  renderSectionMessage() {
    const handleChange = item => {
      const messageValue = `say #!${item.id}`
      this.setState({ messageValue })
      this.fetchItem(messageValue)
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

    const contentItem = this.props.contentItems[this.state.itemId]
    const schema = (contentItem && contentItem.categorySchema) || { json: {}, ui: {} }
    const textContent = (contentItem && `${contentItem.categoryTitle} | ${contentItem.previewText}`) || ''

    return (
      <div>
        <h5>Message {help}:</h5>
        <div className={`${style.section} input-group`}>
          <input
            type="text"
            name="message"
            placeholder="Message to send"
            value={textContent}
            disabled
            className="form-control"
          />
          <span className="input-group-btn">
            <button className={`btn btn-default ${style.editButton}`} type="button" onClick={this.editItem}>
              Edit...
            </button>
          </span>

          <CreateOrEditModal
            show={this.state.showItemEdit}
            schema={schema.json}
            uiSchema={schema.ui}
            handleClose={() => this.setState({ showItemEdit: false, contentToEdit: null })}
            formData={this.state.contentToEdit}
            handleEdit={this.handleFormEdited}
            handleCreateOrUpdate={this.handleUpdate}
          />
          <span className="input-group-btn">
            <button
              className="btn btn-default"
              type="button"
              onClick={() => window.botpress.pickContent({}, handleChange)}
            >
              Pick Content...
            </button>
          </span>
        </div>
      </div>
    )
  }

  render() {
    const props = this.props
    const noop = () => {}

    const onClose = props.onClose || noop
    const onSubmit = () => {
      const handler = props.onSubmit || noop
      this.resetForm()
      handler({
        type: this.state.actionType,
        functionName: this.state.functionInputValue,
        message: this.state.messageValue,
        parameters: this.state.functionParams
      })
    }

    return (
      <Modal animation={false} show={props.show} onHide={onClose} container={document.getElementById('app')}>
        <Modal.Header closeButton>
          <Modal.Title>{this.state.isEdit ? 'Edit' : 'Add new'} action</Modal.Title>
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
          <Button onClick={onSubmit} bsStyle="primary">
            {this.state.isEdit ? 'Update' : 'Add'} Action (Alt+Enter)
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
}

const mapStateToProps = state => ({ contentItems: state.content.itemsById })
const mapDispatchToProps = { fetchContentItem, upsertContentItems }

export default connect(mapStateToProps, mapDispatchToProps)(ActionModalForm)
