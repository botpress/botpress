import React, { Component } from 'react'
import { FormControl, Button, Modal, Alert } from 'react-bootstrap'
import classnames from 'classnames'

import Select from 'react-select'
import style from './style.scss'

const ACTIONS = {
  TEXT: 'text',
  REDIRECT: 'redirect',
  TEXT_REDIRECT: 'text_redirect'
}

export default class FormModal extends Component {
  defaultState = {
    item: {
      questions: [],
      answer: '',
      redirectFlow: '',
      redirectNode: '',
      action: ACTIONS.TEXT,
      category: '',
      enabled: true
    },
    invalidFields: {
      category: true,
      questions: true,
      answer: true,
      checkbox: true,
      redirectFlow: true,
      redirectNode: true
    },
    isText: true,
    isRedirect: false,
    isValidForm: true
  }

  constructor(props) {
    super(props)
    this.state = this.defaultState
  }

  componentDidUpdate(prevProps) {
    const { id } = this.props
    if (prevProps.id === id) {
      return
    }
    if (!id) {
      return this.setState(this.defaultState)
    }
    this.props.bp.axios.get(`/api/botpress-qna/${id}`).then(({ data }) => {
      const item = { ...data, questions: data.questions.join('\n') }
      this.setState({
        item,
        isRedirect: [ACTIONS.REDIRECT, ACTIONS.TEXT_REDIRECT].includes(item.action),
        isText: [ACTIONS.TEXT, ACTIONS.TEXT_REDIRECT].includes(item.action)
      })
    })
  }

  changeItemProperty = (key, value) => {
    const { item } = this.state

    this.setState({ item: { ...item, [key]: value } })
  }

  handleSelect = key => ({ value }) => this.changeItemProperty(key, value)

  changeItemAction = actionType => () => {
    this.setState({ [actionType]: !this.state[actionType] }, () => {
      const { isText, isRedirect } = this.state
      const action = isText && isRedirect ? ACTIONS.TEXT_REDIRECT : isRedirect ? ACTIONS.REDIRECT : ACTIONS.TEXT

      this.changeItemProperty('action', action)
    })
  }

  validateForm() {
    const { hasCategory, categories } = this.props
    const { item, isText, isRedirect } = this.state
    const categoryWrapper = hasCategory ? { category: !categories.length || item.category } : {}
    const invalidFields = {
      ...categoryWrapper,
      questions: item.questions,
      answer: !this.state.isText || this.state.item.answer,
      checkbox: isText || isRedirect,
      redirectFlow: !this.state.isRedirect || this.state.item.redirectFlow,
      redirectNode: !this.state.isRedirect || this.state.item.redirectNode
    }

    this.setState({ invalidFields })

    for (const field in invalidFields) {
      if (!invalidFields[field]) {
        return true
      }
    }

    return false
  }

  onCreate = event => {
    event.preventDefault()
    if (this.validateForm()) {
      this.setState({ isValidForm: false })

      return
    }

    if (!this.state.isValidForm) {
      this.setState({ isValidForm: true })
    }

    return this.props.bp.axios.post('/api/botpress-qna', this.state.item).then(() => {
      this.onClose()
      this.props.fetchData()
    })
  }

  onEdit = event => {
    event.preventDefault()
    if (this.validateForm()) {
      this.setState({ isValidForm: false })

      return
    }

    if (!this.state.isValidForm) {
      this.setState({ isValidForm: true })
    }

    const item = {
      ...this.state.item,
      questions: this.state.item.questions.split(/\n/)
    }

    return this.props.bp.axios.put(`/api/botpress-qna/${this.props.id}`, item).then(() => {
      this.onClose()
      this.props.fetchData()
    })
  }

  onClose = () => {
    this.props.toggleQnAModal()
  }

  alertMessage() {
    if (this.state.isValidForm) {
      return null
    }

    const isValidInputs = Object.values(this.state.invalidFields).find(Boolean)

    return (
      <div>
        {!this.state.invalidFields.checkbox ? <Alert bsStyle="danger">Action checkbox is required</Alert> : null}
        {isValidInputs ? <Alert bsStyle="danger">Inputs are required</Alert> : null}
      </div>
    )
  }

  render() {
    const { item: { redirectFlow }, invalidFields } = this.state
    const { flows, flowsList, showQnAModal, categories, modalType } = this.props
    const currentFlow = flows ? flows.find(({ name }) => name === redirectFlow) || { nodes: [] } : { nodes: [] }
    const nodeList = currentFlow.nodes.map(({ name }) => ({ label: name, value: name }))
    const isEdit = modalType === 'edit'

    return (
      <Modal className={classnames(style['new-qna-modal'], 'new-qna-modal')} show={showQnAModal} onHide={this.onClose}>
        <form onSubmit={!isEdit ? this.onCreate : this.onEdit}>
          <Modal.Header className={style['qna-modal-header']}>
            <Modal.Title>{!isEdit ? 'Create a new' : 'Edit'} Q&A</Modal.Title>
          </Modal.Header>

          <Modal.Body className={style['qna-modal-body']}>
            {this.alertMessage()}
            {this.props.hasCategory ? (
              <div className={style['qna-category']}>
                <span className={style['qna-category__title']}>Category</span>
                <Select
                  className={classnames(style['qna-category__select'], {
                    'qna-category-error': !invalidFields.category
                  })}
                  value={this.state.item.category}
                  options={categories}
                  onChange={this.handleSelect('category')}
                  placeholder="Search or choose category"
                />
              </div>
            ) : null}
            <div className={style['qna-questions']}>
              <span className={style['qna-questions__title']}>Questions</span>
              <span className={style['qna-questions__hint']}>
                Type/Paste your questions here separated with a new line
              </span>
              <FormControl
                className={classnames(style['qna-questions__textarea'], {
                  'qna-category-error': !invalidFields.questions
                })}
                value={this.state.item.questions.join('\n')}
                onChange={event => this.changeItemProperty('questions', event.target.value.split(/\n/))}
                componentClass="textarea"
              />
            </div>
            <div className={style['qna-reply']}>
              <span className={style['qna-reply__title']}>Reply with:</span>
              <div className={style['qna-answer']}>
                <span className={style['qna-answer__check']}>
                  <input type="checkbox" checked={this.state.isText} onChange={this.changeItemAction('isText')} />&nbsp;
                  Type your answer
                </span>
                <FormControl
                  className={classnames(style['qna-answer__textarea'], {
                    'qna-category-error': !invalidFields.answer
                  })}
                  value={this.state.item.answer}
                  onChange={event => this.changeItemProperty('answer', event.target.value)}
                  componentClass="textarea"
                />
              </div>
              <div className={style['qna-and-or']}>
                <div className={style['qna-and-or__line']} />
                <div className={style['qna-and-or__text']}>and / or</div>
                <div className={style['qna-and-or__line']} />
              </div>
              <div className={style['qna-redirect']}>
                <div className={style['qna-redirect-to-flow']}>
                  <span className={style['qna-redirect-to-flow-check']}>
                    <input
                      type="checkbox"
                      checked={this.state.isRedirect}
                      onChange={this.changeItemAction('isRedirect')}
                      className={style['qna-redirect-to-flow-check__checkbox']}
                    />&nbsp;Redirect to flow
                  </span>
                  <Select
                    className={classnames(style['qna-redirect-to-flow-check__select'], {
                      'qna-category-error': !invalidFields.redirectFlow
                    })}
                    value={this.state.item.redirectFlow}
                    options={flowsList}
                    onChange={this.handleSelect('redirectFlow')}
                  />
                </div>
                <div className={style['qna-redirect-node']}>
                  <span className={style['qna-redirect-node__title']}>Node</span>
                  <Select
                    className={classnames(style['qna-redirect-node__select'], {
                      'qna-category-error': !invalidFields.redirectNode
                    })}
                    value={this.state.item.redirectNode}
                    options={nodeList}
                    onChange={this.handleSelect('redirectNode')}
                  />
                </div>
              </div>
            </div>
          </Modal.Body>

          <Modal.Footer className={style['qna-modal-footer']}>
            <Button className={style['qna-modal-footer__cancel-btn']} onClick={this.onClose}>
              Cancel
            </Button>
            <Button className={style['qna-modal-footer__save-btn']} type="submit">
              {isEdit ? 'Edit' : 'Save'}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    )
  }
}
