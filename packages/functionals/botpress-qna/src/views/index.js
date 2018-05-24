import React, { Component } from 'react'

import {
  Row,
  Col,
  FormGroup,
  ControlLabel,
  FormControl,
  Checkbox,
  Radio,
  Panel,
  ButtonToolbar,
  Button,
  Well
} from 'react-bootstrap'
import Select from 'react-select'

import classnames from 'classnames'
import find from 'lodash/find'

import ArrayEditor from './ArrayEditor'
import QuestionsEditor from './QuestionsEditor'
import style from './style.scss'

const getInputValue = input => {
  switch (input.type) {
    case 'radio':
      const els = [].slice.call(document.getElementsByName(input.name))
      for (const el of els) {
        if (el.checked) {
          return el.value
        }
      }
      return null
    case 'checkbox':
      return input.checked
    default:
      return input.value
  }
}

const cleanupQuestions = questions => questions.map(q => q.trim()).filter(Boolean)

const ACTIONS = {
  TEXT: 'text',
  REDIRECT: 'redirect'
}

export default class QnaAdmin extends Component {
  createEmptyQuestion() {
    return {
      id: null,
      data: {
        questions: [''],
        answer: '',
        redirectFlow: '',
        redirectNode: '',
        action: ACTIONS.TEXT,
        enabled: true
      }
    }
  }

  state = {
    newItem: this.createEmptyQuestion(),
    items: [],
    flows: null
  }

  fetchFlows() {
    this.props.bp.axios.get('/api/flows/all').then(({ data }) => {
      this.setState({ flows: data })
    })
  }

  fetchData() {
    this.props.bp.axios.get('/api/botpress-qna/').then(({ data }) => {
      this.setState({ items: data })
    })
  }

  componentDidMount() {
    this.fetchData()
    this.fetchFlows()
  }

  onCreate = value => {
    const data = {
      ...value.data,
      questions: cleanupQuestions(value.data.questions)
    }
    return this.props.bp.axios.post('/api/botpress-qna/', data).then(({ data: id }) => ({
      // update the value with the retrieved ID
      id,
      // and the cleaned data
      data
    }))
  }

  onEdit = index => {
    const value = this.state.items[index]
    this.props.bp.axios.put(`/api/botpress-qna/${value.id}`, value.data)
  }

  onDelete = value => {
    this.props.bp.axios.delete(`/api/botpress-qna/${value.id}`)
  }

  onInputChange = (index, prop, onChange) => event =>
    this.onPropChange(index, prop, onChange)(getInputValue(event.target))

  onSelectChange = (index, prop, onChange) => ({ value }) => this.onPropChange(index, prop, onChange)(value)

  onPropChange = (index, prop, onChange) => propValue => {
    const value = index == null ? this.state.newItem : this.state.items[index]
    onChange(
      {
        ...value,
        data: {
          ...value.data,
          [prop]: propValue
        }
      },
      index
    )
  }

  onQuestionsChanged = (index, onChange) => questions => {
    const value = index == null ? this.state.newItem : this.state.items[index]
    onChange(
      {
        ...value,
        data: {
          ...value.data,
          questions
        }
      },
      index
    )
  }

  updateState = newState => this.setState(newState)

  getFormControlId = (index, suffix) => `form-${index != null ? index : 'new'}-${suffix}`

  canSave = data =>
    !!cleanupQuestions(data.questions).length &&
    (data.action === ACTIONS.TEXT ? !!data.answer : !!data.redirectFlow && !!data.redirectNode)

  renderRedirectSelect(index, onChange) {
    const { flows } = this.state
    if (!flows) {
      return null
    }
    const flowOptions = flows.map(({ name }) => ({ label: name, value: name }))

    const { data } = index == null ? this.state.newItem : this.state.items[index]
    const { redirectFlow } = data

    const nodeOptions = !redirectFlow
      ? []
      : find(flows, { name: redirectFlow }).nodes.map(({ name }) => ({ label: name, value: name }))

    return (
      <div className={style.paddedRow}>
        <Row>
          <Col sm={6} md={2}>
            Flow:
          </Col>
          <Col sm={6} md={4}>
            <Select
              value={redirectFlow}
              options={flowOptions}
              onChange={this.onSelectChange(index, 'redirectFlow', onChange)}
            />
          </Col>

          <Col sm={6} md={2}>
            Node:
          </Col>
          <Col sm={6} md={4}>
            <Select
              value={data.redirectNode}
              options={nodeOptions}
              onChange={this.onSelectChange(index, 'redirectNode', onChange)}
            />
          </Col>
        </Row>
      </div>
    )
  }

  renderForm = ({ data }, index, { isDirty, onCreate, onEdit, onReset, onDelete, onChange }) => (
    <Well bsSize="small" bsClass={classnames('well', style.qna, { [style.pale]: !data.enabled })}>
      {index == null && <h4>New Q&amp;A</h4>}

      <Checkbox
        checked={data.enabled}
        onChange={this.onInputChange(index, 'enabled', onChange)}
        bsClass={classnames('checkbox', { [style.strong]: data.enabled })}
      >
        Enabled
      </Checkbox>

      <Panel>
        <Panel.Heading>Questions</Panel.Heading>
        <Panel.Body>
          <QuestionsEditor items={data.questions} onChange={this.onQuestionsChanged(index, onChange)} />
        </Panel.Body>
      </Panel>

      <FormGroup>
        <strong>Reply with:</strong>&nbsp;&nbsp;&nbsp;
        <Radio
          name={this.getFormControlId(index, 'action')}
          value={ACTIONS.TEXT}
          checked={data.action === ACTIONS.TEXT}
          onChange={this.onInputChange(index, 'action', onChange)}
          inline
        >
          text answer
        </Radio>
        <Radio
          name={this.getFormControlId(index, 'action')}
          value={ACTIONS.REDIRECT}
          checked={data.action === ACTIONS.REDIRECT}
          onChange={this.onInputChange(index, 'action', onChange)}
          inline
        >
          redirect to flow node
        </Radio>
      </FormGroup>

      {data.action === ACTIONS.TEXT && (
        <FormGroup controlId={this.getFormControlId(index, 'answer')}>
          <ControlLabel>Answer:</ControlLabel>
          <FormControl
            componentClass="textarea"
            placeholder="Answer"
            value={data.answer}
            onChange={this.onInputChange(index, 'answer', onChange)}
          />
        </FormGroup>
      )}

      {data.action === ACTIONS.REDIRECT && this.renderRedirectSelect(index, onChange)}

      <ButtonToolbar>
        <Button type="button" onClick={() => onReset(index)} disabled={!isDirty}>
          Reset
        </Button>
        {index != null && (
          <Button type="button" bsStyle="danger" onClick={() => onDelete(index)}>
            Delete
          </Button>
        )}
        <Button
          type="button"
          bsStyle="success"
          onClick={() => (index != null ? onEdit(index) : onCreate())}
          disabled={!isDirty || !this.canSave(data)}
        >
          {index != null ? `${isDirty ? '* ' : ''}Save` : 'Create'}
        </Button>
      </ButtonToolbar>
    </Well>
  )

  render() {
    return (
      <Panel>
        <Panel.Body>
          <ArrayEditor
            items={this.state.items}
            newItem={this.state.newItem}
            renderItem={this.renderForm}
            onCreate={this.onCreate}
            onEdit={this.onEdit}
            onDelete={this.onDelete}
            updateState={this.updateState}
            createNewItem={this.createEmptyQuestion}
          />
        </Panel.Body>
      </Panel>
    )
  }
}
