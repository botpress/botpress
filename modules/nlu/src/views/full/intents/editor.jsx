import React from 'react'
import SplitterLayout from 'react-splitter-layout'
import nanoid from 'nanoid'
import _ from 'lodash'

import Editor from './draft/editor'

import style from './style.scss'
import Slots from './slots/Slots'
import Creatable from 'react-select/lib/Creatable'
import classnames from 'classnames'
import { BotpressTooltip } from 'botpress/tooltip'

const NLU_TABIDX = 3745

export default class IntentsEditor extends React.Component {
  state = {
    initialUtterances: '',
    slotsEditor: null,
    slots: [],
    utterances: [],
    selectedContextOptions: []
  }

  editorRef = null

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
    const { utterances, slots, contexts } = (props && props.intent) || {
      utterances: [],
      slots: [],
      contexts
    }
    const availableContexts = props.contexts
    const expanded = this.expandCanonicalUtterances(utterances)

    if (!_.get(expanded, 'length') || _.get(expanded, '0.text.length')) {
      // ensure there's an empty utterance at the beginning
      expanded.unshift({ id: nanoid(), text: '' })
    }

    const selectedContextOptions =
      contexts &&
      contexts.map(x => {
        return { value: x, label: x }
      })

    this.initialHash = this.computeHash({ slots, utterances: expanded, contexts })
    this.setState({
      utterances: expanded,
      slots: slots,
      contexts,
      selectedContextOptions,
      availableContexts
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

  saveIntent = async () => {
    await this.props.axios.post(`/mod/nlu/intents`, {
      name: this.props.intent.name,
      utterances: this.getCanonicalUtterances(this.state.utterances),
      slots: this.state.slots,
      contexts: this.state.contexts
    })

    this.initialHash = this.computeHash({
      utterances: this.state.utterances,
      slots: this.state.slots,
      contexts: this.state.contexts
    })

    this.props.reloadIntents && (await this.props.reloadIntents())
  }

  async componentDidUpdate() {
    if (this.isDirty()) {
      await this.saveIntent()
      this.props.onUtterancesChange && this.props.onUtterancesChange()
    }
  }

  onBeforeLeave = () => {
    if (this.isDirty()) {
      return confirm('You have unsaved changed that will be lost. Are you sure you want to leave?')
    }

    return true
  }

  getCanonicalUtterances = utterances => (utterances || []).map(x => x.text).filter(x => x.length)

  expandCanonicalUtterances = utterances =>
    utterances.map(u => ({
      id: nanoid(),
      text: u
    }))

  computeHash = ({ contexts, utterances, slots }) =>
    JSON.stringify({
      utterances: this.getCanonicalUtterances(utterances),
      slots,
      contexts
    })

  isDirty = () =>
    this.computeHash({ utterances: this.state.utterances, slots: this.state.slots, contexts: this.state.contexts }) !==
    this.initialHash

  focusFirstUtterance = () => this.editorRef && this.editorRef.focus()

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
                tabIndex={i + NLU_TABIDX}
                getSlotsEditor={() => this.slotsEditor}
                ref={el => {
                  if (i === 0) {
                    this.editorRef = el
                    if (el && this.currFocus === i) {
                      el.focus()
                    }
                  }
                }}
                onFocus={() => (this.currFocus = i)}
                onBlur={() => (this.currFocus = null)}
                utteranceId={utterance.id}
                deleteUtterance={() => this.deleteUtterance(utterance.id)}
                onDone={() => setTimeout(this.focusFirstUtterance, 500)}
                onInputConsumed={preprendNewUtterance}
                canonicalValue={utterance.text}
                canonicalValueChanged={value => canonicalValueChanged(utterance.id, value)}
                slots={this.state.slots}
              />
            </li>
          )
        })}
        <div tabIndex={utterances.length + NLU_TABIDX + 1} onFocus={this.focusFirstUtterance} />
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

  handleChangeContext = selectedContextOptions => {
    this.setState({ selectedContextOptions, contexts: selectedContextOptions.map(x => x.value) })
  }

  render() {
    if (!this.props.intent) {
      return this.renderNone()
    }

    const { name } = this.props.intent

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
        <div className={classnames('pull-left', style.selectContext)}>
          <div>
            <label for="selectContext">Current contexts</label>
            &nbsp;
            <BotpressTooltip message="You can type in the select bar to add new contexts. To learn more about contexts, try the Welcome Bot." />
          </div>
          <Creatable
            id="selectContext"
            isMulti
            onChange={this.handleChangeContext}
            value={this.state.selectedContextOptions}
            options={
              this.state.availableContexts &&
              this.state.availableContexts.map(x => {
                return { value: x, label: x }
              })
            }
          />
        </div>
        <div>
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
      </div>
    )
  }
}
