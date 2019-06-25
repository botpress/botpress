import React from 'react'
import { Container } from 'botpress/ui'
import _ from 'lodash'

import IntentEditor from './editor'
import NLUSidePanel from './SidePanel'

export class IntentsComponent extends React.Component {
  state = {
    showNavIntents: true,
    intents: [],
    currentIntent: null
  }

  componentDidMount() {
    this.fetchIntents()
    this.fetchContexts()
  }

  fetchIntents = () => {
    return this.props.bp.axios.get('/mod/nlu/intents').then(res => {
      const dataToSet = { intents: res.data.filter(x => !x.name.startsWith('__qna__')) }

      if (!this.state.currentIntent) {
        dataToSet.currentIntent = _.get(_.first(dataToSet.intents), 'name')
      }

      this.setState(dataToSet)
    })
  }

  fetchContexts = () => {
    this.props.bp.axios.get(`/mod/nlu/contexts`).then(({ data }) => {
      this.setState({ contexts: data })
    })
  }

  getIntents = () => this.state.intents || []

  getCurrentIntent = () => _.find(this.getIntents(), { name: this.state.currentIntent })

  setCurrentIntent = name => {
    if (this.state.currentIntent !== name) {
      if (this.intentEditor && this.intentEditor.onBeforeLeave) {
        if (this.intentEditor.onBeforeLeave() !== true) {
          return
        }
      }

      this.setState({ currentIntent: name })
    }
  }

  createNewIntent = async () => {
    const name = prompt('Enter the name of the new intent')

    if (!name || !name.length) {
      return
    }

    if (/[^a-z0-9-_.]/i.test(name)) {
      alert('Invalid name, only alphanumerical characters, underscores and hypens are accepted')
      return this.createNewIntent()
    }

    await this.props.bp.axios.post(`/mod/nlu/intents`, { name })
    await this.fetchIntents()
    await this.setCurrentIntent(name)
  }

  deleteIntent = intent => {
    const confirmDelete = window.confirm(`Are you sure you want to delete the intent "${intent}" ?`)
    if (confirmDelete) {
      return this.props.bp.axios.delete(`/mod/nlu/intents/${intent}`).then(() => {
        this.fetchIntents()
      })
    }
  }

  render() {
    return (
      <Container>
        <NLUSidePanel
          intents={this.getIntents()}
          currentIntent={this.state.currentIntent}
          setCurrentIntent={this.setCurrentIntent}
          deleteIntent={this.deleteIntent}
          createIntent={this.createNewIntent}
        />
        <IntentEditor
          ref={el => (this.intentEditor = el)}
          intent={this.getCurrentIntent()}
          contexts={this.state.contexts}
          router={this.props.router}
          axios={this.props.bp.axios}
          reloadIntents={this.fetchIntents}
          contentLang={this.props.contentLang}
        />
      </Container>
    )
  }
}
