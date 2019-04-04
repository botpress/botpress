import React from 'react'
import { SelectIntent } from './shared/intentSelect'

export class IntentMatching extends React.Component {
  state = {
    intentName: undefined,
    intents: [],
    selectedIntentOption: undefined
  }

  componentDidMount() {
    this.fetchIntents()

    const data = this.props.initialData
    if (data) {
      this.setState({
        intentName: data.intentName,
        selectedIntentOption: { value: data.intentName, label: data.intentName }
      })
    }
  }

  componentDidUpdate() {
    const intentName = this.state.selectedIntentOption && this.state.selectedIntentOption.value
    const intent = this.state.intents && this.state.intents.find(x => x.name === intentName)
    const intentSlots = intent && intent.slots && intent.slots.map(x => x.name)

    console.log('slots', intentSlots, 'intent', intent, 'intentName', intentName)

    const data = {
      intentName,
      intentSlots
    }

    if (data.intentName && data.intentSlots) {
      this.props.onDataChanged && this.props.onDataChanged(data)
      this.props.onValidChanged && this.props.onValidChanged(true)
    }
  }

  fetchIntents = () => {
    this.props.bp.axios.get(`/mod/nlu/intents`).then(response => {
      this.setState({ intents: response.data })
    })
  }

  handleIntentChange = selectedIntentOption => {
    this.setState({ selectedIntentOption })
  }

  render() {
    return (
      <SelectIntent
        value={this.state.selectedIntentOption}
        intents={this.state.intents}
        onChange={this.handleIntentChange}
      />
    )
  }
}
