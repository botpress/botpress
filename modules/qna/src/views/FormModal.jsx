import React, { Component } from 'react'
import { FormControl, Button, Modal, Alert } from 'react-bootstrap'
import classnames from 'classnames'
import some from 'lodash/some'

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
      category: false,
      questions: false,
      answer: false,
      checkbox: false,
      redirectFlow: false,
      redirectNode: false
    },
    isText: true,
    isRedirect: false,
    isValidForm: true
  }

  state = this.defaultState

  componentDidUpdate(prevProps) {
    const { id } = this.props
    if (prevProps.id === id) {
      return
    }
    if (!id) {
      return this.setState(this.defaultState)
    }
    this.props.bp.axios.get(`/api/ext/qna/question/${id}`).then(({ data: { data: item } }) => {
      this.setState({
        item,
        isRedirect: [ACTIONS.REDIRECT, ACTIONS.TEXT_REDIRECT].includes(item.action),
        isText: [ACTIONS.TEXT, ACTIONS.TEXT_REDIRECT].includes(item.action)
      })
    })
  }

  closeAndClear = () => {
    this.props.closeQnAModal()
    this.setState(this.defaultState)
  }

  changeItemProperty = (key, value) => {
    const { item } = this.state

    this.setState({ item: { ...item, [key]: value } })
  }

  handleSelect = key => selectedOption =>
    this.changeItemProperty(key, selectedOption ? selectedOption.value : selectedOption)

  changeItemAction = actionType => () => {
    this.setState({ [actionType]: !this.state[actionType] }, () => {
      const { isText, isRedirect } = this.state
      const action = isText && isRedirect ? ACTIONS.TEXT_REDIRECT : isRedirect ? ACTIONS.REDIRECT : ACTIONS.TEXT

      this.changeItemProperty('action', action)
    })
  }

  validateForm() {
    const { item, isText, isRedirect } = this.state
    const invalidFields = {
      questions: !item.questions.length || !item.questions[0].length,
      answer: isText && !item.answer.length,
      checkbox: !(isText || isRedirect),
      redirectFlow: isRedirect && !item.redirectFlow,
      redirectNode: isRedirect && !item.redirectNode
    }

    this.setState({ invalidFields })
    return some(invalidFields)
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

    return this.props.bp.axios.post('/api/ext/qna/create', this.state.item).then(() => {
      this.props.fetchData()
      this.closeAndClear()
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

    const {
      page,
      filters: { question, categories }
    } = this.props

    return this.props.bp.axios
      .put(`/api/ext/qna/${this.props.id}`, this.state.item, {
        params: { ...page, question, categories: categories.map(({ value }) => value) }
      })
      .then(({ data }) => {
        this.props.updateQuestion(data)
        this.closeAndClear()
      })
  }

  alertMessage() {
    if (this.state.isValidForm) {
      return null
    }

    const hasInvalidInputs = Object.values(this.state.invalidFields).find(Boolean)

    return (
      <div>
        {this.state.invalidFields.checkbox ? <Alert bsStyle="danger">Action checkbox is required</Alert> : null}
        {hasInvalidInputs ? <Alert bsStyle="danger">Inputs are required</Alert> : null}
      </div>
    )
  }

  render() {
    const {
      item: { redirectFlow },
      invalidFields
    } = this.state
    const { flows, flowsList, showQnAModal, categories, modalType } = this.props
    const currentFlow = flows ? flows.find(({ name }) => name === redirectFlow) || { nodes: [] } : { nodes: [] }
    const nodeList = currentFlow.nodes.map(({ name }) => ({ label: name, value: name }))
    const isEdit = modalType === 'edit'

    return (
      <Modal className={classnames(style.newQnaModal, 'newQnaModal')} show={showQnAModal} onHide={this.closeAndClear}>
        <form onSubmit={!isEdit ? this.onCreate : this.onEdit}>
          <Modal.Header className={style.qnaModalHeader}>
            <Modal.Title>{!isEdit ? 'Create a new' : 'Edit'} Q&A</Modal.Title>
          </Modal.Header>

          <Modal.Body className={style.qnaModalBody}>
            {this.alertMessage()}
            {categories.length ? (
              <div className={style.qnaCategory}>
                <span className={style.qnaCategoryTitle}>Category</span>
                <Select
                  className={classnames(style.qnaCategorySelect, {
                    qnaCategoryError: invalidFields.category
                  })}
                  value={this.state.item.category}
                  options={categories}
                  onChange={this.handleSelect('category')}
                  placeholder="Search or choose category"
                />
              </div>
            ) : null}
            <div className={style.qnaQuestions}>
              <span className={style.qnaQuestionsTitle}>Questions</span>
              <span className={style.qnaQuestionsHint}>Type/Paste your questions here separated with a new line</span>
              <FormControl
                className={classnames(style.qnaQuestionsTextarea, {
                  qnaCategoryError: invalidFields.questions
                })}
                value={(this.state.item.questions || []).join('\n')}
                onChange={event => this.changeItemProperty('questions', event.target.value.split(/\n/))}
                componentClass="textarea"
              />
            </div>
            <div className={style.qnaReply}>
              <span className={style.qnaReplyTitle}>Reply with:</span>
              <div className={style.qnaAnswer}>
                <span className={style.qnaAnswerCheck}>
                  <input type="checkbox" checked={this.state.isText} onChange={this.changeItemAction('isText')} />
                  &nbsp; Type your answer
                </span>
                <FormControl
                  className={classnames(style.qnaAnswerTextarea, {
                    qnaCategoryError: invalidFields.answer
                  })}
                  value={this.state.item.answer}
                  onChange={event => this.changeItemProperty('answer', event.target.value)}
                  componentClass="textarea"
                />
              </div>
              <div className={style.qnaAndOr}>
                <div className={style.qnaAndOrLine} />
                <div className={style.qnaAndOrText}>and / or</div>
                <div className={style.qnaAndOrLine} />
              </div>
              <div className={style.qnaRedirect}>
                <div className={style.qnaRedirectToFlow}>
                  <span className={style.qnaRedirectToFlowCheck}>
                    <input
                      type="checkbox"
                      checked={this.state.isRedirect}
                      onChange={this.changeItemAction('isRedirect')}
                      className={style.qnaRedirectToFlowCheckCheckbox}
                    />
                    &nbsp;Redirect to flow
                  </span>
                  <Select
                    className={classnames(style.qnaRedirectToFlowCheckSelect, {
                      qnaCategoryError: invalidFields.redirectFlow
                    })}
                    value={this.state.item.redirectFlow}
                    options={flowsList}
                    onChange={this.handleSelect('redirectFlow')}
                  />
                </div>
                <div className={style.qnaRedirectNode}>
                  <span className={style.qnaRedirectNodeTitle}>Node</span>
                  <Select
                    className={classnames(style.qnaRedirectNodeSelect, {
                      qnaCategoryError: invalidFields.redirectNode
                    })}
                    value={this.state.item.redirectNode}
                    options={nodeList}
                    onChange={this.handleSelect('redirectNode')}
                  />
                </div>
              </div>
            </div>
          </Modal.Body>

          <Modal.Footer className={style.qnaModalFooter}>
            <Button className={style.qnaModalFooterCancelBtn} onClick={this.closeAndClear}>
              Cancel
            </Button>
            <Button className={style.qnaModalFooterSaveBtn} type="submit">
              {isEdit ? 'Edit' : 'Save'}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    )
  }
}
