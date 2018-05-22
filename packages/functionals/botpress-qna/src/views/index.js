import React, { Component, Fragment } from 'react'

import { FormGroup, ControlLabel, FormControl, Checkbox, Panel, ButtonToolbar, Button } from 'react-bootstrap'

import classnames from 'classnames'

import ArrayEditor from './ArrayEditor'
import style from './style.scss'

const getInputValue = input => {
  switch (input.type) {
    case 'checkbox':
      return input.checked
    default:
      return input.value
  }
}

class QuestionsEditor extends Component {
  onQuestionChange = (index, onChange) => event => {
    onChange(event.target.value, index)
  }

  updateState = newState => {
    if (newState.newItem != null) {
      this.setState({ newItem: newState.newItem })
    }
    if (newState.items != null) {
      this.props.onChange(newState.items)
    }
  }

  addEmptyQuestion = () => {
    this.props.onChange([''].concat(this.props.items))
  }

  renderForm = (data, index, { onDelete, onChange }) => {
    if (index == null) {
      return (
        <ButtonToolbar>
          <Button type="button" bsStyle="success" onClick={this.addEmptyQuestion}>
            Add another question
          </Button>
        </ButtonToolbar>
      )
    }

    return (
      <Fragment>
        <FormGroup>
          <FormControl
            componentClass="textarea"
            placeholder="Question"
            value={data}
            onChange={this.onQuestionChange(index, onChange)}
          />
        </FormGroup>

        <ButtonToolbar>
          <Button type="button" bsSize="sm" bsStyle="danger" onClick={() => onDelete(index)}>
            Delete
          </Button>
        </ButtonToolbar>
      </Fragment>
    )
  }

  render() {
    return (
      <Panel>
        <Panel.Body>
          <ArrayEditor
            items={this.props.items}
            renderItem={this.renderForm}
            updateState={this.updateState}
            createNewItem={() => ''}
          />
        </Panel.Body>
      </Panel>
    )
  }
}

const cleanupQuestions = questions => questions.map(q => q.trim()).filter(Boolean)

export default class QnaAdmin extends Component {
  createEmptyQuestion() {
    return {
      id: null,
      data: {
        questions: [''],
        answer: '',
        enabled: true
      }
    }
  }

  state = {
    newItem: this.createEmptyQuestion(),
    items: []
  }

  componentDidMount() {
    this.props.bp.axios.get('/api/botpress-qna/').then(({ data }) => {
      this.setState({ items: data })
    })
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

  onPropChange = (index, prop, onChange) => event => {
    const value = index == null ? this.state.newItem : this.state.items[index]
    onChange(
      {
        ...value,
        data: {
          ...value.data,
          [prop]: getInputValue(event.target)
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

  canSave = data => !!data.answer && !!cleanupQuestions(data.questions).length

  renderForm = ({ data }, index, { isDirty, onCreate, onEdit, onReset, onDelete, onChange }) => (
    <Fragment>
      {index == null && <h3>New Q&amp;A</h3>}
      <Checkbox checked={data.enabled} onChange={this.onPropChange(index, 'enabled', onChange)}>
        Enabled
      </Checkbox>
      <FormGroup controlId={this.getFormControlId(index, 'answer')}>
        <ControlLabel>Answer:</ControlLabel>
        <FormControl
          componentClass="textarea"
          placeholder="Answer"
          value={data.answer}
          onChange={this.onPropChange(index, 'answer', onChange)}
        />
      </FormGroup>

      <Panel>
        <Panel.Heading>Questions</Panel.Heading>
        <Panel.Body>
          <QuestionsEditor items={data.questions} onChange={this.onQuestionsChanged(index, onChange)} />
        </Panel.Body>
      </Panel>

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
    </Fragment>
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
