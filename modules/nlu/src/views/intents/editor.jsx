import React from 'react'
import SplitterLayout from 'react-splitter-layout'
import nanoid from 'nanoid'
import _ from 'lodash'

import Editor from './draft/editor'

import style from './style.scss'
import Slots from './slots/Slots'

export default class IntentsEditor extends React.Component {
  state = {
    initialUtterances: '',
    slotsEditor: null,
    isDirty: false,
    slots: [],
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
    const { utterances, slots } = (props && props.intent) || { utterances: [], slots: [] }
    const expanded = this.expandCanonicalUtterances(utterances)

    if (!_.get(expanded, 'length') || _.get(expanded, '0.text.length')) {
      expanded.unshift({ id: nanoid(), text: '' })
    }

    this.setState({ utterances: expanded, slots: slots, isDirty: false }, () => {
      this.initialHash = this.computeHash()
      this.forceUpdate()
    })
  }

  deleteIntent = () => {
    if (!confirm('Are you sure you want to delete this intent? This is not revertable.')) {
      return
    }

    this.props.axios.delete(`/mod/nlu/intents/${this.props.intent.name}`).then(() => {
      this.props.reloadIntents && this.props.reloadIntents()
    })
  }

  saveIntent = () => {
    this.props.axios
      .post(`/mod/nlu/intents/${this.props.intent.name}`, {
        utterances: this.getCanonicalUtterances(),
        slots: this.state.slots
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

  // TODO use somekind of web crypto to compute an actuall hash
  computeHash = () =>
    JSON.stringify({
      utterances: this.getCanonicalUtterances(),
      slots: this.state.slots
    })

  isDirty = () => this.initialHash && this.computeHash() !== this.initialHash

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
                tabIndex={i + 1}
                getSlotsEditor={() => this.slotsEditor}
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
                slots={this.state.slots}
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

  handleSlotsChanged = (slots, { operation, name, oldName } = {}) => {
    const replaceObj = { slots }

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

    if (this.isDirty()) {
      this.saveIntent()
      this.props.onUtterancesChange()
    }

    return (
      <div className={style.container}>
        <div className={style.header}>
          <div className="pull-left">
            <h1>
              intents/
              <span className={style.intent}>{name}</span>
            </h1>
          </div>
        </div>
        <SplitterLayout secondaryInitialSize={350} secondaryMinSize={200}>
          {this.renderEditor()}
          <div className={style.entitiesPanel}>
            <Slots
              ref={el => (this.slotsEditor = el)}
              axios={this.props.axios}
              slots={this.state.slots}
              onSlotsChanged={this.handleSlotsChanged}
            />
          </div>
        </SplitterLayout>
      </div>
    )
  }
}
