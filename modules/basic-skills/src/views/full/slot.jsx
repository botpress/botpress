import React from 'react'
import { Row, Col, Label, Input } from 'reactstrap'
import ContentPickerWidget from 'botpress/content-picker'
import SelectActionDropdown from 'botpress/select-action-dropdown'
import Select from 'react-select'
import style from './style.scss'
import { SelectIntent } from './shared/intentSelect'

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
    validationAction: undefined
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
        addValidation: !!data.validationAction
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
    if (isNaN(value)) {
      return
    }

    this.setState({ maxRetryAttempts: value })
  }

  handleActionChange = value => {
    console.log('action value', value)
    this.setState({ validationAction: value })
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
            <Col>
              <Label>Choose an intent</Label>
              <SelectIntent
                className={style.intentSelect}
                value={this.state.selectedIntentOption}
                intents={this.state.intents}
                onChange={this.handleIntentChange}
              />
            </Col>
          </Row>
          <Row>
            <Col>
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
            <Col>
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
            <Col>
              <Input
                type="checkbox"
                id="validationCheck"
                name="validationCheck"
                onChange={this.toggleAddValidation}
                checked={this.addValidation}
              />
              &nbsp;
              <Label for="validationCheck">Input validation action</Label>
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
          <Row>
            <Col md="9">
              <Label>Not Found Message</Label>
              <ContentPickerWidget
                id="notFoundElement"
                name="notFoundElement"
                className={style.notFoundSelect}
                itemId={this.state.notFoundElement}
                onChange={this.handleNotFoundChange}
                placeholder="Pick content to display when the slot is not found"
              />
            </Col>
            <Col md="3">
              <Label for="retryAttempts">Max retry attempts</Label>
              <Input
                id="retryAttempts"
                name="retryAttempts"
                type="numeric"
                value={this.state.maxRetryAttempts}
                onChange={this.handleMaxRetryAttemptsChange}
              />
            </Col>
          </Row>
        </div>
      </React.Fragment>
    )
  }
}
