import React from 'react'
import { Row, Col, Label, Input } from 'reactstrap'
import ContentPickerWidget from 'botpress/content-picker'
import SelectActionDropdown from 'botpress/select-action-dropdown'
import Select from 'react-select'
import style from './style.scss'
import { SelectIntent } from './shared/intentSelect'

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
    retryAttemptsTooHigh: false
  }

  componentDidMount() {
    this.fetchIntents()
    this.fetchActions()

    const data = this.props.initialData
    if (data) {
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
      contexts: intent && intent.contexts,
      validationAction: this.state.validationAction
    }

    if (this.state.selectedIntentOption && this.state.selectedSlotOption && this.state.contentElement) {
      this.props.onDataChanged && this.props.onDataChanged(data)
      this.props.onValidChanged && this.props.onValidChanged(true)
    }
  }

  fetchIntents = () => {
    this.props.bp.axios.get('/mod/nlu/intents').then(response => {
      this.setState({
        intents: response.data
      })
    })
  }

  fetchActions = () => {
    this.props.bp.axios.get(`/actions`).then(({ data }) => {
      this.setState({
        actions: data.filter(action => !action.metadata.hidden)
      })
    })
  }

  handleContentChange = item => {
    this.setState({ contentElement: item.id })
  }

  handleSlotChange = selectedSlotOption => {
    this.setState({ selectedSlotOption })
  }

  handleIntentChange = selectedIntentOption => {
    this.setState({ selectedIntentOption, selectedSlotOption: undefined })
  }

  handleNotFoundChange = item => {
    this.setState({ notFoundElement: item.id })
  }

  handleMaxRetryAttemptsChange = event => {
    const value = Number(event.target.value)
    if (value > MAX_RETRIES) {
      this.setState({ retryAttemptsTooHigh: true })
    } else {
      this.setState({ maxRetryAttempts: value, retryAttemptsTooHigh: false })
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
          <Row>
            <Col md={6}>
              <Label>Choose an intent</Label>
              <SelectIntent
                style={{ zIndex: 1000 }}
                value={this.state.selectedIntentOption}
                intents={this.state.intents}
                onChange={this.handleIntentChange}
              />
            </Col>
            <Col md={6}>
              <Label for="slotName">Choose a slot to fill</Label>
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
              <ContentPickerWidget
                name="contentPicker"
                id="contentPicker"
                className={style.contentPicker}
                itemId={this.state.contentElement}
                onChange={this.handleContentChange}
                placeholder="Pick content"
              />
            </Col>
          </Row>
          <Row>
            <Col md="9">
              <Label>Not Found Message</Label>
              <ContentPickerWidget
                id="notFoundElement"
                className={style.notFoundSelect}
                itemId={this.state.notFoundElement}
                onChange={this.handleNotFoundChange}
                placeholder="Pick content to display when the slot is not found"
              />
            </Col>
            <Col md="3">
              <Label for="retryAttempts">Max retry attempts</Label>
              {this.state.retryAttemptsTooHigh && (
                <div className={style.warning}>Choose a number less than or equal to {MAX_RETRIES}</div>
              )}
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
