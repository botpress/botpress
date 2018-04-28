import React from 'react'
import { Badge, Button } from 'react-bootstrap'

import SplitterLayout from 'react-splitter-layout'
import nanoid from 'nanoid'
import _ from 'lodash'

import Editor from './draft/editor'

import style from './style.scss'
import EntitiesEditor from './entities/index'

export default class IntentsEditor extends React.Component {
  state = {
    initialUtterances: '',
    entitiesEditor: null,
    isDirty: false,
    entities: [
      // {
      //   id: '0',
      //   colors: 1,
      //   name: 'DepartureDate',
      //   type: '@native.date'
      // },
      // {
      //   id: '1',
      //   colors: 3,
      //   name: 'ArrivalDate',
      //   type: '@native.date'
      // },
      // {
      //   id: '2',
      //   colors: 5,
      //   name: 'PassengerCount',
      //   type: '@native.number'
      // }
    ],
    utterances: []
  }

  firstUtteranceRef = null

  componentDidMount() {
    this.initiateStateFromProps(this.props)

    if (this.props.router) {
      this.props.router.registerTransitionHook(this.onBeforeLeave)
    }
  }

  componentWillUnmount() {
    if (this.props.router) {
      this.props.router.unregisterTransitionHook(this.onBeforeLeave)
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.intent !== this.props.intent) {
      this.initiateStateFromProps(nextProps)
    }
  }

  initiateStateFromProps(props) {
    const { utterances, entities } = (props && props.intent) || { utterances: [], entities: [] }
    const expanded = this.expandCanonicalUtterances(utterances)

    if (!_.get(expanded, 'length') || _.get(expanded, '0.text.length')) {
      expanded.unshift({ id: nanoid(), text: '' })
    }

    this.setState({ utterances: expanded, entities: entities, isDirty: false }, () => {
      this.initialHash = this.computeHash()
      this.forceUpdate()
    })
  }

  deleteIntent = () => {
    if (!confirm('Are you sure you want to delete this intent? This is not revertable.')) {
      return
    }

    this.props.axios.delete(`/api/botpress-nlu/intents/${this.props.intent.name}`).then(() => {
      this.props.reloadIntents && this.props.reloadIntents()
    })
  }

  saveIntent = () => {
    this.props.axios
      .post(`/api/botpress-nlu/intents/${this.props.intent.name}`, {
        utterances: this.getCanonicalUtterances(),
        entities: this.state.entities
      })
      .then(() => {
        this.props.reloadIntents && this.props.reloadIntents()
      })
  }

  onBeforeLeave = () => {
    if (this.isDirty()) {
      return confirm('You have unsaved changed that will be lost. Are you sure you want to leave?')
    }

    return true
  }

  getCanonicalUtterances = () => this.state.utterances.map(x => x.text).filter(x => x.length)

  expandCanonicalUtterances = utterances =>
    utterances.map(u => ({
      id: nanoid(),
      text: u
    }))

  computeHash = () =>
    JSON.stringify({
      utterances: this.getCanonicalUtterances(),
      entities: this.state.entities
    })

  isDirty = () => this.initialHash && this.computeHash() !== this.initialHash

  fetchEntities = () => {
    return this.props.axios.get(`/api/botpress-nlu/entities`).then(res => res.data)
  }

  focusFirstUtterance = () => {
    if (this.firstUtteranceRef) {
      this.firstUtteranceRef.focus()
    }
  }

  deleteUtterance = id => {
    const utterances = this.getUtterances()
    this.setState({ utterances: _.filter(utterances, u => u.id !== id) })
  }

  renderEditor() {
    const utterances = this.getUtterances()
    const preprendNewUtterance = () => {
      this.setState({ utterances: [{ id: nanoid(), text: '' }, ...utterances] })
    }
    const canonicalValueChanged = (id, value) => {
      this.setState({
        utterances: utterances.map(utterance => {
          if (utterance.id === id) {
            return Object.assign({}, utterance, {
              text: value
            })
          } else {
            return utterance
          }
        })
      })
    }

    return (
      <ul className={style.utterances}>
        {utterances.map((utterance, i) => {
          return (
            <li key={`uttr-${utterance.id}`}>
              <Editor
                getEntitiesEditor={() => this.entitiesEditor}
                ref={el => {
                  if (i === 0) {
                    this.firstUtteranceRef = el
                  }
                }}
                utteranceId={utterance.id}
                deleteUtterance={() => this.deleteUtterance(utterance.id)}
                onDone={this.focusFirstUtterance}
                onInputConsumed={preprendNewUtterance}
                canonicalValue={utterance.text}
                canonicalValueChanged={value => canonicalValueChanged(utterance.id, value)}
                entities={this.state.entities}
              />
            </li>
          )
        })}
      </ul>
    )
  }

  renderNone() {
    return (
      <div>
        <h1>No intent selected</h1>
      </div>
    )
  }

  onEntitiesChanged = (entities, { operation, name, oldName } = {}) => {
    const replaceObj = { entities: entities }

    if (operation === 'deleted') {
      let utterances = this.getUtterances()

      const regex = new RegExp(`\\[([^\\[\\]\\(\\)]+?)\\]\\(${name}\\)`, 'gi')
      utterances = utterances.map(u => {
        const text = u.text.replace(regex, '$1')
        return Object.assign({}, u, { text: text })
      })

      replaceObj.utterances = utterances
    } else if (operation === 'modified') {
      let utterances = this.getUtterances()

      const regex = new RegExp(`\\[([^\\(\\)\\[\\]]+?)\\]\\(${oldName}\\)`, 'gi')
      utterances = utterances.map(u => {
        const text = u.text.replace(regex, `[$1](${name})`)
        return Object.assign({}, u, { text: text })
      })

      replaceObj.utterances = utterances
    }

    this.setState(replaceObj)
  }

  getUtterances = () => {
    let utterances = this.state.utterances

    if (!utterances.length) {
      utterances = [{ id: nanoid(), text: '' }]
      this.setState({ utterances })
    }

    return utterances
  }

  render() {
    if (!this.props.intent) {
      return this.renderNone()
    }

    const { name } = this.props.intent

    const dirtyLabel = this.isDirty() ? <Badge bsClass={style.unsavedBadge}>Unsaved changes</Badge> : null

    return (
      <div className={style.container}>
        <div className={style.header}>
          <div className="pull-left">
            <h1>
              intents/<span className={style.intent}>{name}</span>
              {dirtyLabel}
            </h1>
          </div>
          <div className="pull-right">
            <Button onClick={this.saveIntent} disabled={!this.isDirty()} bsStyle="success" bsSize="small">
              Save
            </Button>
            <Button onClick={this.deleteIntent} bsStyle="danger" bsSize="small">
              Delete
            </Button>
          </div>
        </div>
        <SplitterLayout secondaryInitialSize={350} secondaryMinSize={200}>
          {this.renderEditor()}
          <div className={style.entitiesPanel}>
            <EntitiesEditor
              axios={this.props.axios}
              ref={el => (this.entitiesEditor = el)}
              entities={this.state.entities}
              onEntitiesChanged={this.onEntitiesChanged}
            />
          </div>
        </SplitterLayout>
      </div>
    )
  }
}
