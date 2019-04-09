import React from 'react'
import { Row, Col, Label, Input } from 'reactstrap'
import ContentPickerWidget from 'botpress/content-picker'
import SelectActionDropdown from 'botpress/select-action-dropdown'
import Select from 'react-select'
import style from './style.scss'
import { Alert } from 'react-bootstrap'
import { BotpressTooltip } from 'botpress/tooltip'

const MAX_RETRIES = 10

export class Slot extends React.Component {
  state = {
    selectedIntentOption: undefined,
    selectedSlotOption: undefined,
    selectedValidationOption: undefined,
    contentElement: undefined,
    notFoundElement: undefined,
    intents: [],
    addValidation: false,
    maxRetryAttempts: 3,
    actions: [],
    validationAction: undefined,
    error: undefined
  }

  componentDidMount() {
    this.fetchActions()
    this.fetchIntents().then(() => this.setStateFromProps())
  }

  componentDidUpdate() {
    const intentName = this.state.selectedIntentOption && this.state.selectedIntentOption.value
    const intent = intentName && this.state.intents.find(x => x.name === intentName)
    const slotName = this.state.selectedSlotOption && this.state.selectedSlotOption.value
    const slot = intent && intent.slots.find(x => x.name === slotName)
    const entity = slot && slot.entity

    const data = {
      validationRegex: this.state.validationRegex,
      retryAttempts: this.state.maxRetryAttempts,
      contentElement: this.state.contentElement,
      notFoundElement: this.state.notFoundElement,
      slotName,
      intent: intentName,
      entity,
      validationAction: this.state.validationAction
    }

    if (
      this.state.selectedIntentOption &&
      this.state.selectedSlotOption &&
      this.state.contentElement &&
      this.state.notFoundElement
    ) {
      this.props.onDataChanged && this.props.onDataChanged(data)
      this.props.onValidChanged && this.props.onValidChanged(true)
    }
  }

  fetchIntents = () => {
    return this.props.bp.axios.get('/mod/nlu/intents').then(({ data }) => {
      const intents = data.filter(x => !x.name.startsWith('__qna'))
      this.setState({ intents })
    })
  }

  setStateFromProps = () => {
    const data = this.props.initialData

    if (data) {
      this.validateIntentExists(data.intent)
      this.validateSlotExists(data.intent, data.slotName)

      this.setState({
        selectedSlotOption: { value: data.slotName, label: data.slotName },
        selectedIntentOption: { value: data.intent, label: data.intent },
        contentElement: data.contentElement,
        notFoundElement: data.notFoundElement,
        validationAction: data.validationAction && data.validationAction.value,
        addValidation: data.validationAction !== undefined
      })
    }
  }

  fetchActions = () => {
    this.props.bp.axios.get(`/actions`).then(({ data }) => {
      this.setState({
        actions: data.filter(action => !action.metadata.hidden)
      })
    })
  }

  validateIntentExists = intentName => {
    const exists = this.state.intents.find(x => x.name === intentName)
    if (!exists) {
      this.setState({ error: 'Missing intent: This intent does not exists anymore!' })
    }
  }

  validateSlotExists = (intentName, slotName) => {
    const currentIntent = this.state.intents.find(x => x.name === intentName)
    if (!currentIntent || !currentIntent.slots.find(x => x.name === slotName)) {
      this.setState({ error: 'Missing slot: This slot does not exits anymore!' })
    }
  }

  handleContentChange = item => {
    this.setState({ contentElement: item.id })
  }

  handleSlotChange = selectedSlotOption => {
    this.validateSlotExists(this.state.selectedIntentOption.value, selectedSlotOption.value)
    this.setState({ selectedSlotOption })
  }

  handleIntentChange = selectedIntentOption => {
    this.validateIntentExists(selectedIntentOption.value)
    this.setState({ selectedIntentOption, selectedSlotOption: undefined })
  }

  handleNotFoundChange = item => {
    this.setState({ notFoundElement: item.id })
  }

  handleMaxRetryAttemptsChange = event => {
    const value = Number(event.target.value)
    if (value > MAX_RETRIES) {
      this.setState({ error: `Too many retry attempts: Choose a number less than or equal to ${MAX_RETRIES}` })
    } else {
      this.setState({ maxRetryAttempts: value })
    }
  }

  handleActionChange = value => {
    this.setState({ validationAction: { value, label: value } })
  }

  toggleAddValidation = () => {
    this.setState({ addValidation: !this.state.addValidation })
  }

  render() {
    const intentName = this.state.selectedIntentOption && this.state.selectedIntentOption.value
    const intent = this.state.intents.find(x => x.name === intentName)
    const slotOptions =
      intent &&
      intent.slots.map(slot => {
        return { value: slot.name, label: slot.name }
      })

    return (
      <React.Fragment>
        <div className={style.modalContent}>
          {this.state.error && <Alert bsStyle="danger">{this.state.error}</Alert>}
          <Row>
            <Col md={6}>
              <Label>Choose an intent</Label>
              <Select
                id="intent"
                name="intent"
                isSearchable={true}
                className={style.intentSelect}
                onChange={this.handleIntentChange}
                value={this.state.selectedIntentOption}
                options={this.state.intents.map(intent => {
                  return { value: intent.name, label: intent.name }
                })}
              />
            </Col>
            <Col md={6}>
              <Label for="slot">Choose a slot to fill</Label>
              <Select
                id="slot"
                name="slot"
                className={style.slotSelect}
                isSearchable={true}
                onChange={this.handleSlotChange}
                value={this.state.selectedSlotOption}
                options={slotOptions}
              />
            </Col>
          </Row>
          <Row>
            <Col md={12}>
              <Label for="contentPicker">Bot will ask</Label>
              <BotpressTooltip message="The bot should ask a question specific about the slot to fill. (e.g. What is your email?)" />
              <ContentPickerWidget
                style={{ zIndex: 0 }}
                name="contentPicker"
                id="contentPicker"
                itemId={this.state.contentElement}
                onChange={this.handleContentChange}
                placeholder="Pick content"
              />
            </Col>
          </Row>
          <Row>
            <Col md="9">
              <Label>Invalid Input Message</Label>
              <BotpressTooltip message="This message will appear to the user when the information he has given is invalid. (e.g. Your email is invalid)"/>
              <ContentPickerWidget
                style={{ zIndex: 0 }}
                id="notFoundElement"
                itemId={this.state.notFoundElement}
                onChange={this.handleNotFoundChange}
                placeholder="Pick content to display when the slot is not found"
              />
            </Col>
            <Col md="3">
              <Label for="retryAttempts">Max retry attempts</Label>
              <BotpressTooltip message="This is the maximum number of times the bot will try to extract the slot. When the limit is reached, the bot will execute the 'On not found' transition."/>
              <Input
                id="retryAttempts"
                name="retryAttempts"
                type="number"
                min="0"
                max={MAX_RETRIES}
                value={this.state.maxRetryAttempts}
                onChange={this.handleMaxRetryAttemptsChange}
              />
            </Col>
          </Row>
          <Row>
            <Col md={12}>
              <Input
                type="checkbox"
                id="validationCheck"
                name="validationCheck"
                onChange={this.toggleAddValidation}
                checked={this.state.addValidation}
              />
              &nbsp;
              <Label for="validationCheck">Custom Input Validation</Label>
              <BotpressTooltip message="You can add custom validation for your slot with an action. It should assign a boolean value to the temp.valid variable."/>
              {this.state.addValidation && (
                <SelectActionDropdown
                  className={style.actionSelect}
                  value={this.state.validationAction && this.state.validationAction.value}
                  options={this.state.actions}
                  onChange={this.handleActionChange}
                />
              )}
            </Col>
          </Row>
        </div>
      </React.Fragment>
    )
  }
}
