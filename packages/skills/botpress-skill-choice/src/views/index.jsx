import React from 'react'
import _ from 'lodash'

import { ListGroup, ListGroupItem, Alert, Tabs, Tab } from 'react-bootstrap'
import { SortableContainer, SortableElement, arrayMove } from 'react-sortable-hoc'

import ContentPickerWidget from 'botpress/content-picker'

import style from './style.scss'

const SortableItem = SortableElement(({ value, onRemove, onChangeKeywords }) => (
  <ListGroupItem>
    <div>
      {value.value}{' '}
      <span className={style.action} onClick={onRemove}>
        Remove
      </span>
    </div>
    <div className={style.keywords}>
      {value.keywords.join(' ')}{' '}
      <span className={style.action} onClick={onChangeKeywords}>
        Edit keywords
      </span>
    </div>
  </ListGroupItem>
))

export default class TemplateModule extends React.Component {
  state = {
    choices: [],
    nbMaxRetries: 1,
    questionValue: 'Please pick one of the following: ',
    invalidOptionValue: 'Invalid choice, please pick one of the following:',
    nameOfQuestionBloc: '#choice',
    nameOfInvalidBloc: '#choice'
  }

  componentDidMount() {
    this.props.resizeBuilderWindow && this.props.resizeBuilderWindow('small')
    const getOrDefault = (propsKey, stateKey) => this.props.initialData[propsKey] || this.state[stateKey]

    if (this.props.initialData) {
      this.setState({
        choices: getOrDefault('choices', 'choices'),
        questionValue: getOrDefault('question', 'questionValue'),
        nbMaxRetries: getOrDefault('maxRetries', 'nbMaxRetries'),
        invalidOptionValue: getOrDefault('invalid', 'invalidOptionValue'),
        nameOfQuestionBloc: getOrDefault('questionBloc', 'nameOfQuestionBloc'),
        nameOfInvalidBloc: getOrDefault('invalidBloc', 'nameOfInvalidBloc')
      })
    }
  }

  componentDidUpdate() {
    this.updateParent()
  }

  updateParent = () => {
    this.props.onDataChanged &&
      this.props.onDataChanged({
        choices: this.state.choices,
        question: this.state.questionValue,
        maxRetries: this.state.nbMaxRetries,
        invalid: this.state.invalidOptionValue,
        questionBloc: this.state.nameOfQuestionBloc,
        invalidBloc: this.state.nameOfInvalidBloc
      })

    if (this.state.choices.length > 1) {
      this.props.onValidChanged && this.props.onValidChanged(true)
    }
  }

  onMaxRetriesChanged = event => {
    this.setState({ nbMaxRetries: isNaN(event.target.value) ? 1 : event.target.value })
  }

  onBlocNameChanged = key => event => {
    let blocName = event.target.value

    if (!blocName.startsWith('#')) {
      blocName = '#' + blocName
    }

    this.setState({ [key]: blocName })
  }

  onNameOfQuestionBlocChanged = this.onBlocNameChanged('nameOfQuestionBloc')
  onNameOfInvalidBlocChanged = this.onBlocNameChanged('nameOfInvalidBloc')

  addChoice = ({ data, previewText: value }) => {
    const newChoice = { value, keywords: [Object.values(data).map(value => value.toLowerCase())] }
    this.setState({ choices: [...this.state.choices, newChoice] })
  }

  onSortEnd = ({ oldIndex, newIndex }) => {
    this.setState({
      choices: arrayMove(this.state.choices, oldIndex, newIndex)
    })
  }

  renderValidationErrors() {
    let error = null

    if (this.state.choices.length < 2) {
      error = 'You need at least two choices'
    }

    return error ? <Alert bsStyle="warning">{error}</Alert> : null
  }

  removeChoice(index) {
    const choices = [...this.state.choices]
    _.pullAt(choices, index)
    this.setState({
      choices: choices
    })
  }

  changeKeywords(index) {
    const keywords = prompt(
      'Enter the keywords to be understood by as this choice, separated by commas',
      this.state.choices[index].keywords.join(', ')
    )

    this.setState({
      choices: this.state.choices.map((c, i) => {
        if (i !== index) {
          return c
        }

        return Object.assign({}, c, { keywords: keywords.split(',').map(k => k.trim().toLowerCase()) })
      })
    })
  }

  textToItemId = text => _.get(text.match(/^say #!(.*)$/), '[1]')

  renderBasic() {
    const SortableList = SortableContainer(({ items }) => {
      return (
        <ListGroup>
          {items.map((value, index) => (
            <SortableItem
              key={`item-${index}`}
              index={index}
              value={value}
              onChangeKeywords={() => this.changeKeywords(index)}
              onRemove={() => this.removeChoice(index)}
            />
          ))}
        </ListGroup>
      )
    })

    const itemId = this.textToItemId(this.state.questionValue)

    return (
      <div className={style.content}>
        <p>This skill allows you to make the user pick a choice.</p>
        <p>
          <b>Question / text</b>
        </p>
        {this.state.questionValue &&
          !itemId && (
            <div>
              <textarea
                title="Storing plain text is depreacted! Please create text content-item for it and use it instead!"
                style={{ backgroundColor: 'lightcoral' }}
                disabled
                value={this.state.questionValue}
              />
            </div>
          )}
        <ContentPickerWidget
          itemId={itemId}
          onChange={item => this.setState({ questionValue: `say #!${item.id}` })}
          placeholder="Question to ask"
        />

        <p>
          <b>Choices</b>
        </p>
        <ContentPickerWidget onChange={this.addChoice} placeholder="Select new choice here" />
        <SortableList
          pressDelay={200}
          helperClass={style.sortableHelper}
          items={this.state.choices}
          onSortEnd={this.onSortEnd}
        />
        {this.renderValidationErrors()}
      </div>
    )
  }

  renderAdvanced() {
    const itemId = this.textToItemId(this.state.invalidOptionValue)
    return (
      <div className={style.content}>
        <div>
          <label htmlFor="inputMaxRetries">Max number of retries</label>
          <input
            id="inputMaxRetries"
            type="number"
            name="quantity"
            min="0"
            max="1000"
            value={this.state.nbMaxRetries}
            onChange={this.onMaxRetriesChanged}
          />
        </div>

        <div>
          <label htmlFor="invalidOptionText">On invalid option, say:</label>

          {this.state.invalidOptionValue &&
            !itemId && (
              <div>
                <textarea
                  title="Storing plain text is depreacted! Please create text content-item for it and use it instead!"
                  style={{ backgroundColor: 'lightcoral' }}
                  disabled
                  id="invalidOptionText"
                  value={this.state.invalidOptionValue}
                />
              </div>
            )}
          <ContentPickerWidget
            itemId={itemId}
            onChange={({ id }) => this.setState({ invalidOptionValue: `say #!${id}` })}
            placeholder="Question to ask"
          />
        </div>

        <div>
          <label htmlFor="nameQuestionBloc">Name of the question bloc:</label>
          <input
            id="nameQuestionBloc"
            type="text"
            value={this.state.nameOfQuestionBloc}
            onChange={this.onNameOfQuestionBlocChanged}
          />
        </div>

        <div>
          <label htmlFor="nameOfInvalidBloc">Name of the invalid bloc:</label>
          <input
            id="nameOfInvalidBloc"
            type="text"
            value={this.state.nameOfInvalidBloc}
            onChange={this.onNameOfInvalidBlocChanged}
          />
        </div>
      </div>
    )
  }

  render() {
    return (
      <Tabs defaultActiveKey={1} id="add-option-skill-tabs" animation={false}>
        <Tab eventKey={1} title="Basic">
          {this.renderBasic()}
        </Tab>
        <Tab eventKey={2} title="Advanced">
          {this.renderAdvanced()}
        </Tab>
      </Tabs>
    )
  }
}
